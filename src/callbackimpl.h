#pragma once
#include "defs.h"
#include <dyncall_callback.h>
#include <mutex>
#include <nan.h>
#include <condition_variable>

namespace fastcall {
struct Loop;

struct CallbackUserData {
    struct Sync {
        std::mutex lock;
        std::condition_variable cond;
    };

    CallbackUserData(
        char resultTypeCode,
        const TCopyablePersistentFunction& execute,
        const TCopyablePersistentFunction& func,
        Loop* loop)
        : resultTypeCode(resultTypeCode)
        , execute(execute)
        , func(func)
        , loop(loop)
    {
        assert(loop);
    }

    char resultTypeCode;
    TCopyablePersistentFunction execute;
    TCopyablePersistentFunction func;
    Loop* loop;
    std::unique_ptr<Sync> threading;

    void ToAsync()
    {
        if (!threading) {
            threading = std::unique_ptr<Sync>(new Sync());
        }
    }
};

DCCallback* MakeDCCallback(const std::string& signature, CallbackUserData* userData);
}
