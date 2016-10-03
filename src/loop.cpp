#include "loop.h"
#include "asyncresultbase.h"
#include "deps.h"
#include "librarybase.h"
#include "locker.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

Loop::Loop(LibraryBase* library, size_t vmSize)
    : LibraryFeature(library)
    , loopThread(new uv_thread_t)
    , loop(new uv_loop_t)
    , shutdownHandle(new uv_async_t)
    , vm(dcNewCallVM(vmSize))
{
    int result;

    result = uv_loop_init(loop);
    assert(!result);

    result = uv_async_init(loop, shutdownHandle, Shutdown);
    shutdownHandle->data = reinterpret_cast<void*>(this);
    assert(!result);

    using namespace std::placeholders;
    callQueue = std::unique_ptr<TCallQueue>(new TCallQueue(this, loop, bind(&Loop::ProcessCallQueueItem, this, _1)));
    releaseQueue = std::unique_ptr<TReleaseQueue>(new TReleaseQueue(this, loop, bind(&Loop::ProcessReleaseQueueItem, this, _1)));
    syncQueue = std::unique_ptr<TSyncQueue>(new TSyncQueue(this, uv_default_loop(), bind(&Loop::ProcessSyncQueueItem, this, _1)));

    uv_thread_create(loopThread, LoopMain, this);
}

Loop::~Loop()
{
    std::unique_lock<std::mutex> ulock(destroyLock);

    syncQueue->Close();
    uv_async_send(shutdownHandle);

    destroyCond.wait(ulock);

    delete loop;
    delete loopThread;
    dcFree(vm);
}

void Loop::Shutdown(uv_async_t* handle)
{
    assert(handle);
    auto self = reinterpret_cast<Loop*>(handle->data);

    uv_close((uv_handle_t*)(self->shutdownHandle), DeleteUVAsyncHandle);
    self->callQueue->Close();
    self->releaseQueue->Close();
    uv_stop(self->loop);
}

void Loop::LoopMain(void* threadArg)
{
    int result;
    auto self = reinterpret_cast<Loop*>(threadArg);

    result = uv_run(self->loop, UV_RUN_DEFAULT);
    assert(!result);
    result = uv_loop_close(self->loop);
    assert(!result);

    {
        std::unique_lock<std::mutex> ulock(self->destroyLock);
        self->destroyCond.notify_one();
    }
}

void Loop::Push(TCallable&& callable)
{
    counter++;
    callQueue->Push(std::move(callable));
}

void Loop::Synchronize(const v8::Local<v8::Function>& callback)
{
    Nan::HandleScope scope;
    if (counter == lastSyncOn) {
        callback->Call(Nan::Null(), 0, {});
    } else {
        auto cb = make_shared<Nan::Callback>(callback);
        Push(make_pair(TOptionalReleaseFunctions(), [=](DCCallVM*) {
            this->syncQueue->Push(cb);
        }));
        lastSyncOn = counter;
    }
}

void Loop::ProcessCallQueueItem(TCallable& item)
{
    item.second(vm);

    if (item.first) {
        releaseQueue->Push(std::move(item.first));
    }
}

void Loop::ProcessReleaseQueueItem(TOptionalReleaseFunctions& item)
{
    assert(item);
    for (auto f : *item) {
        f();
    }
}

void Loop::ProcessSyncQueueItem(std::shared_ptr<Nan::Callback>& item)
{
    Nan::HandleScope scope;
    item->Call(0, {});
}
