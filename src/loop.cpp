#include "loop.h"
#include "deps.h"
#include "locker.h"
#include "librarybase.h"
#include "asyncresultbase.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

Loop::Loop(LibraryBase* library, size_t vmSize)
    : library(library)
    , loop(new uv_loop_t)
    , processCallQueueHandle(new uv_async_t)
    , processReleaseQueueHandle(new uv_async_t)
    , processSyncCallbackQueueHandle(new uv_async_t)
    , vm(dcNewCallVM(vmSize))
{
    int result;

    result = uv_loop_init(loop);
    assert(!result);

    result = uv_async_init(loop, processCallQueueHandle, ProcessCallQueue);
    processCallQueueHandle->data = reinterpret_cast<void*>(this);
    assert(!result);

    result = uv_async_init(loop, processReleaseQueueHandle, ProcessReleaseQueue);
    processReleaseQueueHandle->data = reinterpret_cast<void*>(this);
    assert(!result);

    result = uv_async_init(uv_default_loop(), processSyncCallbackQueueHandle, ProcessSyncQueue);
    processSyncCallbackQueueHandle->data = reinterpret_cast<void*>(this);
    assert(!result);
}

Loop::~Loop()
{
    {
        auto lock(AcquireLock());

        processCallQueueHandle->data = nullptr;
        processReleaseQueueHandle->data = nullptr;
        processSyncCallbackQueueHandle->data = nullptr;
    }

    uv_close(
        (uv_handle_t*)(processCallQueueHandle),
        [](uv_handle_t* ptr) {
            delete (uv_async_t*)ptr;
        });

    uv_close(
        (uv_handle_t*)(processReleaseQueueHandle),
        [](uv_handle_t* ptr) {
            delete (uv_async_t*)ptr;
        });

    uv_close(
        (uv_handle_t*)(processSyncCallbackQueueHandle),
        [](uv_handle_t* ptr) {
            delete (uv_async_t*)ptr;
        });

    uv_stop(loop);
}

void Loop::LoopMain(void* threadArg)
{
    int result;
    auto self = reinterpret_cast<Loop*>(threadArg);
    auto loop = self->loop;
    auto vm = self->vm;

    result = uv_run(loop, UV_RUN_DEFAULT);
    assert(!result);
    result = uv_loop_close(loop);
    assert(!result);
    delete loop;
    dcFree(vm);
}

Lock Loop::AcquireLock()
{
    return library->AcquireLock();
}

void Loop::Push(const TCallable& callable)
{
    auto lock(AcquireLock());
    counter++;
    callQueue.emplace_back(callable);
    int result = uv_async_send(processCallQueueHandle);
    assert(!result);
}

void Loop::Synchronize(const v8::Local<v8::Function>& callback)
{
    Nan::HandleScope scope;
    auto lock(AcquireLock());
    if (counter == lastSyncOn || true) { // DEBUG DEBUG DEBUG DEBUG DEBUG
        callback->Call(Nan::Null(), 0, {});
    }
    else {
        syncQueue.emplace_back(make_shared<Nan::Callback>(callback));
        auto handle = processSyncCallbackQueueHandle;
        Push(make_pair(nullptr, [=](DCCallVM*) {
            int result = uv_async_send(handle);
            assert(!result);
        }));
        lastSyncOn = counter;
    }
}

void Loop::ProcessCallQueue(uv_async_t* handle)
{
    assert(handle);
    auto self = reinterpret_cast<Loop*>(handle->data);
    if (!self) {
        return;
    }

    auto lock(self->AcquireLock());

    // Again, because loop could be destructed before the lock kicked in
    self = reinterpret_cast<Loop*>(handle->data);
    if (!self) {
        return;
    }
    
    bool isDestroyable = false;

    for (int i = self->callQueue.size() - 1; i >= 0; i--)
    {
        auto& callable = self->callQueue[i];
        dcReset(self->vm);
        callable.second(self->vm);
        if (callable.first) {
            self->releaseQueue.push_back(callable.first);
            isDestroyable = true;
        }
    }
    self->callQueue.clear();

    if (isDestroyable) {
        int result = uv_async_send(self->processReleaseQueueHandle);
        assert(!result);
    }
}

void Loop::ProcessReleaseQueue(uv_async_t* handle)
{
    assert(handle);
    auto self = reinterpret_cast<Loop*>(handle->data);
    if (!self) {
        return;
    }

    auto lock(self->AcquireLock());

    // Again, because loop could be destructed before the lock kicked in
    self = reinterpret_cast<Loop*>(handle->data);
    if (!self) {
        return;
    }

    for (auto item : self->releaseQueue)
    {
        item->Release();
    }
    self->releaseQueue.clear();
}

void Loop::ProcessSyncQueue(uv_async_t* handle)
{
    assert(handle);
    auto self = reinterpret_cast<Loop*>(handle->data);
    if (!self) {
        return;
    }
    
    auto lock(self->AcquireLock());

    // Again, because loop could be destructed before the lock kicked in
    self = reinterpret_cast<Loop*>(handle->data);
    if (!self) {
        return;
    }

    for (int i = self->syncQueue.size() - 1; i >= 0; i--)
    {
        Nan::HandleScope scope;

        auto& cb = self->syncQueue[i];
        cb->Call(0, {});
    }
    self->callQueue.clear();
}
