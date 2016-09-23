#include "callbackfactories.h"
#include "deps.h"
#include "defs.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

namespace {
typedef std::vector<v8::Local<v8::Value> > TCallbackArgs;
typedef std::function<TCallbackArgs(DCArgs*)> TDCArgsToCallbackArgs;
typedef std::function<void(DCValue*, char&, const v8::Local<v8::Value>&)> TSetDCValue;

struct CallbackUserData {
    CallbackUserData(const TDCArgsToCallbackArgs& dcArgsToCallbackArgs, const TSetDCValue& setDCValue, Nan::Callback* jsCallback)
        : dcArgsToCallbackArgs(dcArgsToCallbackArgs)
        , setDCValue(setDCValue)
        , jsCallback(jsCallback)
    {
        assert(jsCallback);
    }

    TDCArgsToCallbackArgs dcArgsToCallbackArgs;
    TSetDCValue setDCValue;
    std::unique_ptr<Nan::Callback> jsCallback;
};

TDCArgsToCallbackArgs MakeDCArgsToCallbackArgsFunction(const v8::Local<Object>& cb)
{
    throw logic_error("no implemented");
}

TSetDCValue MakeSetDCValueFunction(const v8::Local<Object>& cb)
{
    throw logic_error("no implemented");
}

std::string GetSignature(const v8::Local<Object>& cb)
{
    // http://www.dyncall.org/docs/manual/manualse4.html#x5-190004.1.3
    Nan::HandleScope scope;

    auto sig = GetValue<String>(cb, "signature");
    assert(!sig.IsEmpty());

    auto result = string(*Nan::Utf8String(sig));
    assert(result.size() >= 2);

    return result;
}

char V8CallbackHandler(DCArgs* args, DCValue* result, CallbackUserData* cbUserData)
{
    Nan::HandleScope scope;

    auto cbArgs = cbUserData->dcArgsToCallbackArgs(args);
    auto value = cbUserData->jsCallback->Call(cbArgs.size(), &cbArgs[0]);
    char resultType = 0;
    cbUserData->setDCValue(result, resultType, value);
    assert(resultType);
    return resultType;
}

char ThreadSafeCallbackHandler(DCCallback* cb, DCArgs* args, DCValue* result, void* userdata)
{
    auto cbUserData = reinterpret_cast<CallbackUserData*>(userdata);
    assert(cbUserData);

    // TODO: Thread safe this
    return V8CallbackHandler(args, result, cbUserData);
}

DCCallback* MakeDCCallback(const std::string& signature, CallbackUserData* userData)
{
    return dcbNewCallback(signature.c_str(), ThreadSafeCallbackHandler, reinterpret_cast<void*>(userData));
}
}

TCallbackFactory fastcall::MakeCallbackFactory(const v8::Local<Object>& cb)
{
    Nan::HandleScope scope;

    auto dcArgsToCallbackArgs = MakeDCArgsToCallbackArgsFunction(cb);
    auto setDCValue = MakeSetDCValueFunction(cb);
    auto signature = GetSignature(cb);
    auto voidPtrType = GetValue<Object>(cb, "_ptrType");
    TCopyablePersistent pVoidPtrType;
    pVoidPtrType.Reset(voidPtrType);

    return [=](const Local<Function>& jsFunc) {
        Nan::EscapableHandleScope scope;

        auto userData = new CallbackUserData(dcArgsToCallbackArgs, setDCValue, new Nan::Callback(jsFunc));
        auto dcCallback = MakeDCCallback(signature, userData);

        auto voidPtrType = Nan::New(pVoidPtrType);
        auto ptr = Wrap<DCCallback>(dcCallback, [](char* data, void* hint) { dcbFreeCallback(reinterpret_cast<DCCallback*>(data)); });
        auto ptrUserData = Wrap<CallbackUserData>(userData);
        SetValue(ptr, "userData", ptrUserData);
        SetValue(ptr, "type", voidPtrType);
        SetValue(ptrUserData, "type", voidPtrType);

        return scope.Escape(ptr);
    };
}
