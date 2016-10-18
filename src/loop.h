#pragma once
#include "defs.h"
#include "functioninvokers.h"
#include "libraryfeature.h"
#include "optional.h"
#include "queue.h"
#include <condition_variable>
#include <dyncall.h>
#include <memory>
#include <mutex>
#include <nan.h>
#include <utility>

namespace fastcall {
struct LibraryBase;
struct AsyncResultBase;

typedef std::shared_ptr<TReleaseFunctions> TReleaseFunctionsPtr;

struct Callable {
    Callable(TAsyncFunctionInvoker&& invoker)
        : invoker(invoker)
    {
    }

    Callable(TAsyncFunctionInvoker&& invoker, TReleaseFunctionsPtr&& releaseFunctions)
        : invoker(invoker)
        , releaseFunctions(releaseFunctions)
    {
    }

    TAsyncFunctionInvoker invoker;
    TReleaseFunctionsPtr releaseFunctions;
};

typedef std::function<void()> TTask;
typedef std::shared_ptr<Callable> TCallablePtr;
typedef std::shared_ptr<TTask> TTaskPtr;

typedef Queue<TCallablePtr> TCallQueue;
typedef Queue<TReleaseFunctionsPtr> TReleaseQueue;
typedef Queue<TCallbackPtr> TSyncQueue;
typedef Queue<TTaskPtr> TTaskQueue;

struct Loop : LibraryFeature {
    Loop(LibraryBase* library, size_t vmSize);
    ~Loop();

    void Push(TCallablePtr callable);
    void Synchronize(const v8::Local<v8::Function>& callback);
    void DoInMainLoop(TTaskPtr task);

private:
    uv_thread_t* loopThread;
    uv_loop_t* loop;
    uv_async_t* shutdownHandle;
    DCCallVM* vm;
    std::unique_ptr<TCallQueue> callQueue;
    std::unique_ptr<TReleaseQueue> releaseQueue;
    std::unique_ptr<TSyncQueue> syncQueue;
    std::unique_ptr<TTaskQueue> mainLoopTaskQueue;
    unsigned counter = 0;
    unsigned lastSyncOn = 0;
    std::mutex destroyLock;
    std::condition_variable destroyCond;

    static void LoopMain(void* threadArg);
    static void Shutdown(uv_async_t* handle);
    void ProcessCallQueueItem(TCallablePtr& item) const;
    void ProcessReleaseQueueItem(TReleaseFunctionsPtr& item) const;
    void ProcessSyncQueueItem(TCallbackPtr& item) const;
    void ProcessMainLoopTaskQueueItem(TTaskPtr& item) const;
};
}
