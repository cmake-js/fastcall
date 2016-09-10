#include "loop.h"
#include "asyncresultbase.h"
#include "deps.h"
#include "librarybase.h"
#include "locker.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

Loop::Loop(LibraryBase* library, size_t vmSize)
    : LibraryFeature(library)
    , loopThread(new uv_thread_t)
    , loop(new uv_loop_t)
    , shutdownHandle(new uv_async_t)
    , processCallQueueHandle(new uv_async_t)
    , processReleaseQueueHandle(new uv_async_t)
    , processSyncCallbackQueueHandle(new uv_async_t)
    , vm(dcNewCallVM(vmSize))
{
    int result;

    result = uv_loop_init(loop);
    assert(!result);

    result = uv_async_init(loop, shutdownHandle, Shutdown);
    shutdownHandle->data = reinterpret_cast<void*>(this);
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

    uv_thread_create(loopThread, LoopMain, this);
}

Loop::~Loop()
{
    std::unique_lock<std::mutex> ulock(destroyLock);

    uv_close((uv_handle_t*)(processSyncCallbackQueueHandle), DeleteUVAsyncHandle);
    uv_async_send(shutdownHandle);

    destroyCond.wait(ulock);

    delete loop;
    delete loopThread;
    dcFree(vm);
}

void Loop::Shutdown(uv_async_t* handle)
{
    assert(handle);
    auto self = reinterpret_cast<Loop*>(handle->data);

    uv_close((uv_handle_t*)(self->shutdownHandle), DeleteUVAsyncHandle);
    uv_close((uv_handle_t*)(self->processCallQueueHandle), DeleteUVAsyncHandle);
    uv_close((uv_handle_t*)(self->processReleaseQueueHandle), DeleteUVAsyncHandle);
    uv_stop(self->loop);
}

void Loop::LoopMain(void* threadArg)
{
    int result;
    auto self = reinterpret_cast<Loop*>(threadArg);

    result = uv_run(self->loop, UV_RUN_DEFAULT);
    assert(!result);
    result = uv_loop_close(self->loop);
    assert(!result);

    {
        std::unique_lock<std::mutex> ulock(self->destroyLock);
        self->destroyCond.notify_one();
    }
}

void Loop::Push(const TCallable& callable)
{
    auto lock(AcquireLock());
    counter++;
    callQueue.emplace(callable);
    int result = uv_async_send(processCallQueueHandle);
    assert(!result);
}

void Loop::Synchronize(const v8::Local<v8::Function>& callback)
{
    Nan::HandleScope scope;
    auto lock(AcquireLock());
    if (counter == lastSyncOn) {
        callback->Call(Nan::Null(), 0, {});
    } else {
        syncQueue.emplace(make_shared<Nan::Callback>(callback));
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

    TCallable callable;
    DCCallVM* vm;
    for (;;) {
        {
            auto lock(self->AcquireLock());

            if (self->callQueue.empty()) {
                return;
            }
            callable = self->callQueue.front();
            vm = self->vm;
            self->callQueue.pop();
        }

        callable.second(vm);

        {
            auto lock(self->AcquireLock());

            if (callable.first) {
                self->releaseQueue.emplace(callable.first);
                int result = uv_async_send(self->processReleaseQueueHandle);
                assert(!result);
            }
        }
    };
}

void Loop::ProcessReleaseQueue(uv_async_t* handle)
{
    assert(handle);
    auto self = reinterpret_cast<Loop*>(handle->data);

    AsyncResultBase* ar;
    for (;;) {
        {
            auto lock(self->AcquireLock());

            if (self->releaseQueue.empty()) {
                return;
            }
            ar = self->releaseQueue.front();
            self->releaseQueue.pop();
        }

        ar->Release();
    };
}

void Loop::ProcessSyncQueue(uv_async_t* handle)
{
    assert(handle);
    auto self = reinterpret_cast<Loop*>(handle->data);

    std::shared_ptr<Nan::Callback> cb;
    {
        auto lock(self->AcquireLock());

        if (self->syncQueue.empty()) {
            return;
        }
        cb = self->syncQueue.front();
        self->syncQueue.pop();
    }

    {
        Nan::HandleScope scope;
        cb->Call(0, {});
    }
}
