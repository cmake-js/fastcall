#pragma once
#include <nan.h>
#include <dyncall.h>
#include <queue>
#include <memory>
#include <utility>
#include <vector>
#include "invokers.h"
#include "locker.h"

namespace fastcall {
struct LibraryBase;
struct AsyncResultBase;

typedef std::pair<AsyncResultBase*, TAsyncInvoker> TCallable;
typedef std::vector<TCallable> TCallQueue;
typedef std::vector<AsyncResultBase*> TReleaseQueue;
typedef std::vector<std::shared_ptr<Nan::Callback>> TSyncQueue;

struct Loop
{
    Loop() = delete;
    Loop(const Loop&) = delete;
    Loop(Loop&&) = delete;
    Loop(LibraryBase* library, size_t vmSize);
    ~Loop();
    
    Lock AcquireLock();
    void Push(const TCallable& callable);
    void Synchronize(const v8::Local<v8::Function>& callback);
    
private:
    LibraryBase* library;
    uv_loop_t loop;
    uv_async_t processCallQueueHandle;
    uv_async_t processReleaseQueueHandle;
    uv_async_t processSyncCallbackQueueHandle;
    DCCallVM* vm;
    TCallQueue callQueue;
    TReleaseQueue releaseQueue;
    TSyncQueue syncQueue;
    unsigned counter = 0;
    unsigned lastSyncOn = 0;
    
    static void ProcessCallQueue(uv_async_t* handle);
    static void ProcessReleaseQueue(uv_async_t* handle);
    static void ProcessSyncQueue(uv_async_t* handle);
};
}
