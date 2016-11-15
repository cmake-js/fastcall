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
        Nan::Global<v8::Function>&& execute,
        Nan::Global<v8::Function>&& func,
        Loop* loop)
        : resultTypeCode(resultTypeCode)
        , execute(std::move(execute))
        , func(std::move(func))
        , loop(loop)
    {
        assert(loop);
    }

    char resultTypeCode;
    Nan::Global<v8::Function> execute;
    Nan::Global<v8::Function> func;
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
