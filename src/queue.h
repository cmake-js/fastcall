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
#include <functional>
#include <nan.h>
#include <queue>
#include "locker.h"
#include "helpers.h"

namespace fastcall {
template <typename TItem>
struct Queue {
    typedef std::queue<TItem> TQueue;
    typedef std::function<void(TItem&)> TProcessItemFunc;

    Queue(Locker* locker, uv_loop_t* loop, TProcessItemFunc processItemFunc)
        : locker(locker)
        , processItemFunc(processItemFunc)
        , handle(new uv_async_t)
    {
        assert(locker);

        int result = uv_async_init(loop, handle, ProcessItems);
        uv_unref((uv_handle_t*)handle);
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
        assert(handle);
        {
            auto lock(AcquireLock());
            queue.emplace(std::forward<Args>(args)...);
        }
        uv_async_send(handle);
    }

    void Close()
    {
        if (handle) {
            uv_close((uv_handle_t*)(handle), DeleteUVAsyncHandle);
            handle = nullptr;
        }
    }

    bool IsEmpty()
    {
        auto lock(AcquireLock());
        return queue.empty();
    }

private:
    Locker* locker;
    TQueue queue;
    TProcessItemFunc processItemFunc;
    uv_async_t* handle;

    Lock AcquireLock()
    {
        return Lock(*locker);
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
                item = std::move(self->queue.front());
                self->queue.pop();
            }

            self->processItemFunc(item);
        };
    }
};
}
