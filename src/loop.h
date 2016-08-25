#pragma once
#include <nan.h>
#include <dyncall.h>
#include <queue>
#include <memory>
#include "invokers.h"
#include "locker.h"

namespace fastcall {
struct Loop
{
    Loop() = delete;
    Loop(const Loop&) = delete;
    Loop(Loop&&) = delete;
    Loop(size_t vmSize);
    ~Loop();
    
    void Push(const TAsyncInvoker& invoker);
    void Synchronize(const v8::Local<v8::Function>& callback);
    
private:
    uv_loop_t loop;
    uv_async_t processCodeQueueHandle;
    uv_async_t processSyncCallbackQueueHandle;
    DCCallVM* vm;
    Locker locker;
    std::queue<TAsyncInvoker> callQueue;
    std::queue<std::shared_ptr<Nan::Callback>> syncQueue;
    unsigned counter = 0;
    unsigned lastSyncOn = 0;
    
    static void ProcessCallQueue(uv_async_t* handle);
    static void ProcessSyncQueue(uv_async_t* handle);
};
}
