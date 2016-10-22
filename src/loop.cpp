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
