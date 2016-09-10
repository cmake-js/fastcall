#pragma once
#include <nan.h>
#include <dyncall.h>
#include <memory>
#include <utility>
#include <queue>
#include <mutex>
#include <condition_variable>
#include "invokers.h"
#include "libraryfeature.h"

namespace fastcall {
struct LibraryBase;
struct AsyncResultBase;

typedef std::pair<AsyncResultBase*, TAsyncInvoker> TCallable;
typedef std::queue<TCallable> TCallQueue;
typedef std::queue<AsyncResultBase*> TReleaseQueue;

struct Loop : LibraryFeature
{
    Loop() = delete;
    Loop(const Loop&) = delete;
    Loop(Loop&&) = delete;
    Loop(LibraryBase* library, size_t vmSize);
    ~Loop();
    
    void Push(const TCallable& callable);
    void Synchronize(const v8::Local<v8::Function>& callback);
    
private:
    uv_thread_t* loopThread;
    uv_loop_t* loop;
    uv_async_t* shutdownHandle;
    uv_async_t* processCallQueueHandle;
    uv_async_t* processReleaseQueueHandle;
    DCCallVM* vm;
    TCallQueue callQueue;
    TReleaseQueue releaseQueue;
    unsigned counter = 0;
    unsigned lastSyncOn = 0;
    std::mutex destroyLock;
    std::condition_variable destroyCond;
    
    static void LoopMain(void* threadArg);
    static void Shutdown(uv_async_t* handle);
    static void ProcessCallQueue(uv_async_t* handle);
    static void ProcessReleaseQueue(uv_async_t* handle);
    static void ProcessSyncHandle(uv_async_t* handle);
};
}
