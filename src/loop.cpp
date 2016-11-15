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

#include "loop.h"
#include "deps.h"
#include "locker.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

Loop::Loop()
{
    using namespace std::placeholders;
    mainLoopTaskQueue = std::unique_ptr<TTaskQueue>(new TTaskQueue(&locker, uv_default_loop(), bind(&Loop::ProcessMainLoopTaskQueueItem, this, _1)));
}

Loop::~Loop()
{
    mainLoopTaskQueue->Close();
}

void Loop::DoInMainLoop(TTask&& task)
{
    mainLoopTaskQueue->Push(std::move(task));
}

void Loop::ProcessMainLoopTaskQueueItem(TTask& item) const
{
    assert(item);
    item();
}
