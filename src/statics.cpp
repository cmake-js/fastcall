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

#ifdef WIN32
#define _WINSOCKAPI_
#include <windows.h>
#else
#include <pthread.h>
#endif
#include "statics.h"
#include "deps.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

namespace {
Nan::Persistent<v8::Object> savedTarget;

#ifdef WIN32
DWORD mainThreadId;
#else
uv_thread_t mainThreadHandle;
#endif
}

NAN_MODULE_INIT(fastcall::InitStatics)
{
    savedTarget.Reset(target);
    Nan::Set(target, Nan::New<String>("makeStringBuffer").ToLocalChecked(), Nan::New<FunctionTemplate>(makeStringBuffer)->GetFunction());
#ifdef WIN32
    mainThreadId = GetCurrentThreadId();
#else
    mainThreadHandle = (uv_thread_t)uv_thread_self();
#endif
}

v8::Local<Value> fastcall::Require(const char* name)
{
    Nan::EscapableHandleScope scope;

    auto target = Nan::New(savedTarget);
    assert(!target.IsEmpty() && target->IsObject());
    auto require = GetValue<v8::Function>(target, "require");
    assert(!require.IsEmpty());
    v8::Local<v8::Value> args[] = { Nan::New<v8::String>(name).ToLocalChecked() };
    auto module = Nan::Call(require, GetGlobal(), 1, args).ToLocalChecked();
    assert(!module->IsUndefined() && !module->IsNull());
    return scope.Escape(module);
}

bool fastcall::IsV8Thread()
{
#ifdef WIN32
    return mainThreadId == GetCurrentThreadId();
#else
    auto currThread = (uv_thread_t)uv_thread_self();
    return pthread_equal(currThread, mainThreadHandle);
#endif
}

NAN_METHOD(fastcall::makeStringBuffer)
{
    auto val = info[0];
    
    if (Buffer::HasInstance(val)) {
        return info.GetReturnValue().Set(val);
    }

    if (val->IsNumber()) {
        auto num = val->Uint32Value();
        return info.GetReturnValue().Set(Nan::NewBuffer(num).ToLocalChecked());
    }

    if (val->IsString()) {
        auto v8Str = val->ToString();
        char* str = strdup(*Nan::Utf8String(val));
        return info.GetReturnValue().Set(
            Nan::NewBuffer(
                str,
                v8Str->Length(),
                [](char *data, void *hint) { free(data); },
                nullptr
            ).ToLocalChecked());
    }
}
