#pragma once
#include <functional>
#include <nan.h>
#include <queue>
#include "libraryfeature.h"
#include "helpers.h"

namespace fastcall {
template <typename TItem>
struct Queue {
    typedef std::queue<TItem> TQueue;
    typedef std::function<void(TItem&)> TProcessItemFunc;

    Queue(LibraryFeature* owner, uv_loop_t* loop, TProcessItemFunc processItemFunc)
        : owner(owner)
        , processItemFunc(processItemFunc)
        , handle(new uv_async_t)
    {
        assert(owner);

        int result = uv_async_init(loop, handle, ProcessItems);
        handle->data = static_cast<void*>(this);
        assert(!result);
    }

    ~Queue()
    {
        delete handle;
    }

    template <typename ...Args>
    void Push(Args&&... args)
    {
        auto lock(AcquireLock());
        queue.emplace(std::forward<Args>(args)...);
        uv_async_send(handle);
    }

    void Close()
    {
        if (handle) {
            uv_close((uv_handle_t*)(handle), DeleteUVAsyncHandle);
            handle = nullptr;
        }
    }

private:
    LibraryFeature* owner;
    TQueue queue;
    TProcessItemFunc processItemFunc;
    uv_async_t* handle;

    Lock AcquireLock()
    {
        return owner->AcquireLock();
    }

    static void ProcessItems(uv_async_t* handle)
    {
        assert(handle);
        auto self = static_cast<Queue<TItem>*>(handle->data);

        TItem item;
        for (;;) {
            {
                auto lock(self->AcquireLock());

                if (self->queue.empty()) {
                    return;
                }
                item = self->queue.front();
                self->queue.pop();
            }

            self->processItemFunc(item);
        };
    }
};
}
