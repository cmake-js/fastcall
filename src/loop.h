/*
Copyright 2016 Gábor Mező (gabor.mezo@outlook.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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
