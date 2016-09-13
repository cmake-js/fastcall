#pragma once
#include <nan.h>
#include <dyncall.h>
#include <memory>
#include <utility>
#include "queue.h"
#include <mutex>
#include <condition_variable>
#include "invokers.h"
#include "libraryfeature.h"
#include "optional.h"

namespace fastcall {
struct LibraryBase;
struct AsyncResultBase;

typedef OPTIONAL_NS::optional<TAsyncResults> TOptionalAsyncResults;
typedef std::pair<TOptionalAsyncResults, TAsyncFunctionInvoker> TCallable;
typedef Queue<TCallable> TCallQueue;
typedef Queue<TOptionalAsyncResults> TReleaseQueue;
typedef Queue<std::shared_ptr<Nan::Callback>> TSyncQueue;

struct Loop : LibraryFeature
{
    Loop(LibraryBase* library, size_t vmSize);
    ~Loop();
    
    void Push(TCallable&& callable);
    void Synchronize(const v8::Local<v8::Function>& callback);
    
private:
    uv_thread_t* loopThread;
    uv_loop_t* loop;
    uv_async_t* shutdownHandle;
    DCCallVM* vm;
    std::unique_ptr<TCallQueue> callQueue;
    std::unique_ptr<TReleaseQueue> releaseQueue;
    std::unique_ptr<TSyncQueue> syncQueue;
    unsigned counter = 0;
    unsigned lastSyncOn = 0;
    std::mutex destroyLock;
    std::condition_variable destroyCond;
    
    static void LoopMain(void* threadArg);
    static void Shutdown(uv_async_t* handle);
    void ProcessCallQueueItem(TCallable& item);
    void ProcessReleaseQueueItem(TOptionalAsyncResults& item);
    void ProcessSyncQueueItem(std::shared_ptr<Nan::Callback>& item);
};
}
