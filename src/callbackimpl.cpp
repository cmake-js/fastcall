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

#include "deps.h"
#include "callbackimpl.h"
#include "helpers.h"
#include "loop.h"
#include "statics.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace fastcall;

namespace {
static v8::Local<v8::Value> executeArgs[3] = { Nan::Undefined(), Nan::Undefined(), Nan::Undefined() };

char V8ThreadCallbackHandler(DCArgs* args, DCValue* result, CallbackUserData* cbUserData)
{
    Nan::HandleScope scope;

    executeArgs[0] = WrapPointer(args);
    executeArgs[1] = WrapPointer(result);
    executeArgs[2] = Nan::New(cbUserData->func);
    auto execute = Nan::New(cbUserData->execute);
    execute->Call(Nan::Undefined(), 3, executeArgs);
    return cbUserData->resultTypeCode;
}

char OtherThreadCallbackHandler(DCArgs* args, DCValue* result, CallbackUserData* cbUserData)
{
    std::unique_lock<std::mutex> ulock(cbUserData->lock);

    auto task = [args, result, cbUserData]() {
        V8ThreadCallbackHandler(args, result, cbUserData);

        {
            std::unique_lock<std::mutex> ulock(cbUserData->lock);
            cbUserData->cond.notify_one();
        }
    };

    cbUserData->loop->DoInMainLoop(std::move(task));

    cbUserData->cond.wait(ulock);

    return cbUserData->resultTypeCode;
}

char ThreadSafeCallbackHandler(DCCallback* cb, DCArgs* args, DCValue* result, void* userdata)
{
    auto userData = reinterpret_cast<CallbackUserData*>(userdata);
    assert(userData);

    if (IsV8Thread()) {
        return V8ThreadCallbackHandler(args, result, userData);
    }
    else {
        return OtherThreadCallbackHandler(args, result, userData);
    }
}
}

DCCallback* fastcall::MakeDCCallback(const string& signature, CallbackUserData* userData)
{
    return dcbNewCallback(signature.c_str(), ThreadSafeCallbackHandler, reinterpret_cast<void*>(userData));
}
