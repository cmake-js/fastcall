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

struct Callable {
    Callable(TAsyncFunctionInvoker&& invoker, TReleaseFunctions&& releaseFunctions)
        : invoker(invoker)
        , releaseFunctions(releaseFunctions)
    {
    }

    TAsyncFunctionInvoker invoker;
    TReleaseFunctions releaseFunctions;
};

typedef std::function<void()> TTask;
typedef std::shared_ptr<Callable> TCallablePtr;

typedef Queue<TCallablePtr> TCallQueue;
typedef Queue<TTask> TTaskQueue;
typedef std::pair<TCallbackPtr, unsigned long> TSyncCallbackQueueItem;

struct Loop : LibraryFeature {
    Loop(LibraryBase* library, size_t vmSize);
    ~Loop();

    void Push(TCallablePtr callable);
    void Synchronize(const v8::Local<v8::Function>& callback);
    void DoInMainLoop(TTask&& task);

private:
    uv_thread_t* loopThread;
    uv_loop_t* loop;
    uv_async_t* shutdownHandle;
    DCCallVM* vm;
    std::unique_ptr<TCallQueue> callQueue;
    std::unique_ptr<TTaskQueue> mainLoopTaskQueue;
    std::queue<TSyncCallbackQueueItem> syncCallbackQueue;
    unsigned long beginCount = 0;
    unsigned long endCount = 0;
    std::mutex destroyLock;
    std::condition_variable destroyCond;

    static void LoopMain(void* threadArg);
    static void Shutdown(uv_async_t* handle);
    void ProcessCallQueueItem(TCallablePtr& item);
    void ProcessMainLoopTaskQueueItem(TTask& item) const;
    void SyncTo(unsigned long count);
};
}
