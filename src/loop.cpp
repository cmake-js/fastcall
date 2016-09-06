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
    , vm(dcNewCallVM(vmSize))
{
    uv_loop_init(&loop);

    uv_async_init(&loop, &processCallQueueHandle, ProcessCallQueue);
    processCallQueueHandle.data = reinterpret_cast<void*>(this);

    uv_async_init(&loop, &processReleaseQueueHandle, ProcessReleaseQueue);
    processReleaseQueueHandle.data = reinterpret_cast<void*>(this);

    uv_async_init(uv_default_loop(), &processSyncCallbackQueueHandle, ProcessSyncQueue);
    processSyncCallbackQueueHandle.data = reinterpret_cast<void*>(this);
}

Loop::~Loop()
{
    dcFree(vm);
    int result = uv_loop_close(&loop);
    assert(!result);
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
    uv_async_send(&processCallQueueHandle);
}

void Loop::Synchronize(const v8::Local<v8::Function>& callback)
{
    Nan::HandleScope scope;
    auto lock(AcquireLock());
    if (counter == lastSyncOn) {
        callback->Call(Nan::Null(), 0, {});
    }
    else {
        syncQueue.emplace_back(make_shared<Nan::Callback>(callback));
        auto handle = &processSyncCallbackQueueHandle;
        Push(make_pair(nullptr, [=](DCCallVM*) {
            uv_async_send(handle);
        }));
        lastSyncOn = counter;
    }
}

void Loop::ProcessCallQueue(uv_async_t* handle)
{
    assert(handle);
    auto self = reinterpret_cast<Loop*>(handle->data);
    assert(self);
    
    bool isDestroyable = false;
    auto lock(self->AcquireLock());

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
        uv_async_send(&self->processReleaseQueueHandle);
    }
}

void Loop::ProcessReleaseQueue(uv_async_t* handle)
{
    assert(handle);
    auto self = reinterpret_cast<Loop*>(handle->data);
    assert(self);

    auto lock(self->AcquireLock());
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
    assert(self);
    
    auto lock(self->AcquireLock());
    for (int i = self->syncQueue.size() - 1; i >= 0; i--)
    {
        Nan::HandleScope scope;

        auto& cb = self->syncQueue[i];
        cb->Call(0, {});
    }
    self->callQueue.clear();
}
