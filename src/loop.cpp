#include "loop.h"
#include "deps.h"
#include "locker.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

Loop::Loop(size_t vmSize)
    : vm(dcNewCallVM(vmSize))
{
    uv_loop_init(&loop);
    uv_async_init(&loop, &processCallQueueHandle, ProcessCallQueue);
    processCallQueueHandle.data = reinterpret_cast<void*>(this);
    uv_async_init(uv_default_loop(), &processSyncCallbackQueueHandle, ProcessSyncQueue);
    processSyncCallbackQueueHandle.data = reinterpret_cast<void*>(this);
}

Loop::~Loop()
{
    dcFree(vm);
    int result = uv_loop_close(&loop);
    assert(!result);
}

void Loop::Push(const TAsyncInvoker& invoker)
{
    Lock _(locker);
    counter++;
    callQueue.push(invoker);
    uv_async_send(&processCallQueueHandle);
}

void Loop::Synchronize(const v8::Local<v8::Function>& callback)
{
    Nan::HandleScope scope;
    Lock _(locker);
    if (counter == lastSyncOn) {
        callback->Call(Nan::Null(), 0, {});
    }
    else {
        syncQueue.emplace(make_shared<Nan::Callback>(callback));
        auto handle = &processSyncCallbackQueueHandle;
        Push([=](DCCallVM*) {
            uv_async_send(handle);
        });
        lastSyncOn = counter;
    }
}

void Loop::ProcessCallQueue(uv_async_t* handle)
{
    assert(handle);
    auto self = reinterpret_cast<Loop*>(handle->data);
    assert(self);
    
    Lock _(self->locker);
    while (!self->callQueue.empty()) {
        auto& func = self->callQueue.front();
        self->callQueue.pop();
        func(self->vm);
    }
}

void Loop::ProcessSyncQueue(uv_async_t* handle)
{
    assert(handle);
    auto self = reinterpret_cast<Loop*>(handle->data);
    assert(self);
    
    Lock _(self->locker);
    while (!self->syncQueue.empty()) {
        Nan::HandleScope scope;
        
        auto cb = self->syncQueue.front();
        self->syncQueue.pop();
        cb->Call(0, {});
    }
}
