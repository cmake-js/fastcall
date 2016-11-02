#pragma once
#include "defs.h"
#include "queue.h"
#include <condition_variable>
#include <dyncall.h>
#include <memory>
#include <mutex>
#include <nan.h>
#include <utility>
#include "locker.h"

namespace fastcall {
typedef std::function<void()> TTask;
typedef Queue<TTask> TTaskQueue;

struct Loop {
    Loop();
    ~Loop();

    void DoInMainLoop(TTask&& task);

private:
    std::unique_ptr<TTaskQueue> mainLoopTaskQueue;
    Locker locker;

    void ProcessMainLoopTaskQueueItem(TTask& item) const;
};
}
