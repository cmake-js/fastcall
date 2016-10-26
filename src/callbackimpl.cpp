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
    execute->Call(Nan::Undefined(), 4, executeArgs);
    return cbUserData->resultTypeCode;
}

char OtherThreadCallbackHandler(DCArgs* args, DCValue* result, CallbackUserData* cbUserData)
{
    cbUserData->ToAsync();
    assert(cbUserData->threading);

    std::unique_lock<std::mutex> ulock(cbUserData->threading->lock);

    auto task = [args, result, cbUserData]() {
        V8ThreadCallbackHandler(args, result, cbUserData);

        {
            std::unique_lock<std::mutex> ulock(cbUserData->threading->lock);
            cbUserData->threading->cond.notify_one();
        }
    };

    cbUserData->loop->DoInMainLoop(std::move(task));

    cbUserData->threading->cond.wait(ulock);

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
