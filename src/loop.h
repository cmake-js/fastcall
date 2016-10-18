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

typedef nonstd::optional<TReleaseFunctions> TOptionalReleaseFunctions;
typedef std::pair<TOptionalReleaseFunctions, TAsyncFunctionInvoker> TCallable;
typedef std::function<void()> TTask;

typedef Queue<TCallable> TCallQueue;
typedef Queue<TOptionalReleaseFunctions> TReleaseQueue;
typedef Queue<TCallbackPtr> TSyncQueue;
typedef Queue<TTask> TTaskQueue;

struct Loop : LibraryFeature {
    Loop(LibraryBase* library, size_t vmSize);
    ~Loop();

    void Push(TCallable&& callable);
    void Synchronize(const v8::Local<v8::Function>& callback);
    void DoInMainLoop(TTask&& task);

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
    void ProcessCallQueueItem(TCallable& item) const;
    void ProcessReleaseQueueItem(TOptionalReleaseFunctions& item) const;
    void ProcessSyncQueueItem(TCallbackPtr& item) const;
    void ProcessMainLoopTaskQueueItem(TTask& item) const;
};
}
