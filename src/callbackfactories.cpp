#include "callbackfactories.h"
#include "dcbarg.h"
#include "defs.h"
#include "deps.h"
#include "getv8value.h"
#include "helpers.h"
#include "int64.h"
#include "statics.h"
#include "loop.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

StaticCallbackData StaticCallbackData::instance;
StaticCallbackData::StaticCallbackData()
{
    args.reserve(16);
}

namespace {
typedef std::function<void(DCArgs*)> TDCArgsToCallbackArgs;
typedef std::function<void(DCValue*, v8::Local<v8::Value>&)> TSetDCValue;
typedef std::function<v8::Local<v8::Value>(DCArgs*)> TArgToValueConverter;

struct CallbackUserData {
    struct Sync {
        std::mutex lock;
        std::condition_variable cond;
    };

    CallbackUserData(
        const TDCArgsToCallbackArgs& dcArgsToCallbackArgs,
        const TSetDCValue& setDCValue,
        Nan::Callback* jsCallback,
        char resultTypeCode,
        Loop* loop)
        : dcArgsToCallbackArgs(dcArgsToCallbackArgs)
        , setDCValue(setDCValue)
        , jsCallback(jsCallback)
        , resultTypeCode(resultTypeCode)
        , loop(loop)
    {
        assert(jsCallback);
        assert(loop);
    }

    TDCArgsToCallbackArgs dcArgsToCallbackArgs;
    TSetDCValue setDCValue;
    std::unique_ptr<Nan::Callback> jsCallback;
    char resultTypeCode;
    std::unique_ptr<Sync> sync;
    Loop* loop;

    void Async()
    {
        if (!sync) {
            sync = std::unique_ptr<Sync>(new Sync());
        }
    }
};

template <typename T, typename F>
TArgToValueConverter MakeArgToValueConverter(const F& f)
{
    return [=](DCArgs* args) {
        T result = f(args);
        return Nan::New(result);
    };
}

template <typename F>
TArgToValueConverter MakeInt64ArgToValueConverter(const F& f)
{
    return [=](DCArgs* args) {
        int64_t result = f(args);
        return MakeInt64(result);
    };
}

template <typename F>
TArgToValueConverter MakeUint64ArgToValueConverter(const F& f)
{
    return [=](DCArgs* args) {
        uint64_t result = f(args);
        return MakeUint64(result);
    };
}

TArgToValueConverter MakePtrArgToValueConverter(const TCopyablePersistent& pointerTypeHolder)
{
    return [=](DCArgs* args) {
        Nan::EscapableHandleScope scope;

        void* result = dcbArgPointer(args);
        auto ref = WrapPointer(result);
        SetValue(ref, "type", Nan::New(pointerTypeHolder));
        return scope.Escape(ref);
    };
}

TDCArgsToCallbackArgs MakeDCArgsToCallbackArgsFunction(const v8::Local<Object>& cb)
{
    Nan::HandleScope scope;

    std::vector<TArgToValueConverter> list;

    auto args = GetValue<Array>(cb, "args");
    unsigned length = args->Length();
    list.reserve(length);
    for (unsigned i = 0; i < length; i++) {
        auto arg = args->Get(i).As<Object>();
        auto type = GetValue<Object>(arg, "type");
        auto typeName = *Nan::Utf8String(GetValue<String>(type, "name"));
        auto indirection = GetValue(type, "indirection")->Uint32Value();

        if (indirection > 1) {
            // pointer:
            auto pointerType = DerefType(type);
            auto pointerTypeHolder = TCopyablePersistent(pointerType);
            list.emplace_back(MakePtrArgToValueConverter(pointerTypeHolder));
            continue;
        } else if (indirection == 1) {
            if (!strcmp(typeName, "int8")) {
                list.emplace_back(MakeArgToValueConverter<int8_t>(dcbArgInt8));
                continue;
            }
            if (!strcmp(typeName, "uint8")) {
                list.emplace_back(MakeArgToValueConverter<uint8_t>(dcbArgUInt8));
                continue;
            }
            if (!strcmp(typeName, "int16")) {
                list.emplace_back(MakeArgToValueConverter<int16_t>(dcbArgInt16));
                continue;
            }
            if (!strcmp(typeName, "uint16")) {
                list.emplace_back(MakeArgToValueConverter<uint16_t>(dcbArgUInt16));
                continue;
            }
            if (!strcmp(typeName, "int32")) {
                list.emplace_back(MakeArgToValueConverter<int32_t>(dcbArgInt32));
                continue;
            }
            if (!strcmp(typeName, "uint32")) {
                list.emplace_back(MakeArgToValueConverter<uint32_t>(dcbArgUInt32));
                continue;
            }
            if (!strcmp(typeName, "int64")) {
                list.emplace_back(MakeInt64ArgToValueConverter(dcbArgInt64));
                continue;
            }
            if (!strcmp(typeName, "uint64")) {
                list.emplace_back(MakeUint64ArgToValueConverter(dcbArgUInt64));
                continue;
            }
            if (!strcmp(typeName, "float")) {
                list.emplace_back(MakeArgToValueConverter<float>(dcbArgFloat));
                continue;
            }
            if (!strcmp(typeName, "double")) {
                list.emplace_back(MakeArgToValueConverter<double>(dcbArgDouble));
                continue;
            }
            if (!strcmp(typeName, "char")) {
                list.emplace_back(MakeArgToValueConverter<char>(dcbArgChar));
                continue;
            }
            if (!strcmp(typeName, "byte")) {
                list.emplace_back(MakeArgToValueConverter<uint8_t>(dcbArgByte));
                continue;
            }
            if (!strcmp(typeName, "uchar")) {
                list.emplace_back(MakeArgToValueConverter<unsigned char>(fastcall::dcbArgUChar));
                continue;
            }
            if (!strcmp(typeName, "short")) {
                list.emplace_back(MakeArgToValueConverter<short>(dcbArgShort));
                continue;
            }
            if (!strcmp(typeName, "ushort")) {
                list.emplace_back(MakeArgToValueConverter<unsigned short>(fastcall::dcbArgUShort));
                continue;
            }
            if (!strcmp(typeName, "int")) {
                list.emplace_back(MakeArgToValueConverter<int>(dcbArgInt));
                continue;
            }
            if (!strcmp(typeName, "uint")) {
                list.emplace_back(MakeArgToValueConverter<unsigned int>(fastcall::dcbArgUInt));
                continue;
            }
            if (!strcmp(typeName, "long")) {
                list.emplace_back(MakeInt64ArgToValueConverter(dcbArgLong));
                continue;
            }
            if (!strcmp(typeName, "ulong")) {
                list.emplace_back(MakeUint64ArgToValueConverter(fastcall::dcbArgULong));
                continue;
            }
            if (!strcmp(typeName, "longlong")) {
                list.emplace_back(MakeInt64ArgToValueConverter(dcbArgLongLong));
                continue;
            }
            if (!strcmp(typeName, "ulonglong")) {
                list.emplace_back(MakeUint64ArgToValueConverter(fastcall::dcbArgULongLong));
                continue;
            }
            if (!strcmp(typeName, "bool")) {
                list.emplace_back(MakeArgToValueConverter<bool>(dcbArgBool));
                continue;
            }
            if (!strcmp(typeName, "size_t")) {
                list.emplace_back(MakeUint64ArgToValueConverter(fastcall::dcbArgSizeT));
                continue;
            }
        }

        throw logic_error("Invalid callback result type.");
    }

    auto& v8Args = StaticCallbackData::instance.args;
    return [&v8Args, list](DCArgs* args) {
        v8Args.clear();
        for (auto& f : list) {
            v8Args.emplace_back(f(args));
        }
    };
}

TSetDCValue MakeSetDCValueFunction(const v8::Local<Object>& cb)
{
    auto resultType = GetValue<Object>(cb, "resultType");
    auto resultTypeName = string(*Nan::Utf8String(GetValue<String>(resultType, "name")));
    auto indirection = GetValue(resultType, "indirection")->Uint32Value();
    auto typeName = resultTypeName.c_str();

    if (indirection > 1) {
        return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
            toValue->p = GetPointer(value);
        };
    } else {
        if (!strcmp(typeName, "int8")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->c = GetInt8(value);
            };
        }
        if (!strcmp(typeName, "uint8")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->C = GetUInt8(value);
            };
        }
        if (!strcmp(typeName, "int16")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->s = GetInt16(value);
            };
        }
        if (!strcmp(typeName, "uint16")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->S = GetUInt16(value);
            };
        }
        if (!strcmp(typeName, "int32")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->i = GetInt32(value);
            };
        }
        if (!strcmp(typeName, "uint32")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->I = GetUInt32(value);
            };
        }
        if (!strcmp(typeName, "int64")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->l = GetInt64(value);
            };
        }
        if (!strcmp(typeName, "uint64")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->L = GetUint64(value);
            };
        }
        if (!strcmp(typeName, "float")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->f = GetFloat(value);
            };
        }
        if (!strcmp(typeName, "double")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->d = GetDouble(value);
            };
        }
        if (!strcmp(typeName, "char")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->c = GetChar(value);
            };
        }
        if (!strcmp(typeName, "byte")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->C = GetByte(value);
            };
        }
        if (!strcmp(typeName, "uchar")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->C = GetUChar(value);
            };
        }
        if (!strcmp(typeName, "short")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->s = GetShort(value);
            };
        }
        if (!strcmp(typeName, "ushort")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->S = GetUShort(value);
            };
        }
        if (!strcmp(typeName, "int")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->i = GetInt(value);
            };
        }
        if (!strcmp(typeName, "uint")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->I = GetUInt(value);
            };
        }
        if (!strcmp(typeName, "long")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->j = GetLong(value);
            };
        }
        if (!strcmp(typeName, "ulong")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->J = GetULong(value);
            };
        }
        if (!strcmp(typeName, "longlong")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->l = GetLongLong(value);
            };
        }
        if (!strcmp(typeName, "ulonglong")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->L = GetULongLong(value);
            };
        }
        if (!strcmp(typeName, "bool")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->B = GetBool(value);
            };
        }
        if (!strcmp(typeName, "size_t")) {
            return [=](DCValue* toValue, v8::Local<v8::Value>& value) {
                toValue->J = GetSizeT(value);
            };
        }

        throw logic_error("Invalid resultType.");
    }
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

char V8ThreadCallbackHandler(DCArgs* args, DCValue* result, CallbackUserData* cbUserData)
{
    Nan::HandleScope scope;

    cbUserData->dcArgsToCallbackArgs(args);
    auto value = cbUserData->jsCallback->Call(StaticCallbackData::instance.args.size(), &StaticCallbackData::instance.args[0]);
    cbUserData->setDCValue(result, value);
    return cbUserData->resultTypeCode;
}

char OtherThreadCallbackHandler(DCArgs* args, DCValue* result, CallbackUserData* cbUserData)
{
    cbUserData->Async();
    assert(cbUserData->sync);

    std::unique_lock<std::mutex> ulock(cbUserData->sync->lock);

    auto task = [args, result, cbUserData]() {
        V8ThreadCallbackHandler(args, result, cbUserData);

        {
            std::unique_lock<std::mutex> ulock(cbUserData->sync->lock);
            cbUserData->sync->cond.notify_one();
        }
    };

    cbUserData->loop->DoInMainLoop(std::make_shared<TTask>(std::move(task)));

    cbUserData->sync->cond.wait(ulock);

    return cbUserData->resultTypeCode;
}

char ThreadSafeCallbackHandler(DCCallback* cb, DCArgs* args, DCValue* result, void* userdata)
{
    auto cbUserData = reinterpret_cast<CallbackUserData*>(userdata);
    assert(cbUserData);

    if (IsV8Thread()) {
        return V8ThreadCallbackHandler(args, result, cbUserData);
    }
    else {
        return OtherThreadCallbackHandler(args, result, cbUserData);
    }
}

DCCallback* MakeDCCallback(const std::string& signature, CallbackUserData* userData)
{
    return dcbNewCallback(signature.c_str(), ThreadSafeCallbackHandler, reinterpret_cast<void*>(userData));
}
}

TCallbackFactory fastcall::MakeCallbackFactory(const v8::Local<Object>& cb, Loop* loop)
{
    Nan::HandleScope scope;

    auto dcArgsToCallbackArgs = MakeDCArgsToCallbackArgsFunction(cb);
    auto setDCValue = MakeSetDCValueFunction(cb);
    auto signature = GetSignature(cb);
    char resultTypeCode = signature[signature.size() - 1];
    auto voidPtrType = GetValue<Object>(cb, "_ptrType");
    TCopyablePersistent pVoidPtrType(voidPtrType);

    return [=](const v8::Local<Object>& callback, const Local<Function>& jsFunc) {
        Nan::EscapableHandleScope scope;

        auto userData = new CallbackUserData(dcArgsToCallbackArgs, setDCValue, new Nan::Callback(jsFunc), resultTypeCode, loop);
        auto dcCallback = MakeDCCallback(signature, userData);

        auto voidPtrType = Nan::New(pVoidPtrType);
        auto ptr = Wrap<DCCallback>(dcCallback, [](char* data, void* hint) { dcbFreeCallback(reinterpret_cast<DCCallback*>(data)); });
        auto ptrUserData = Wrap<CallbackUserData>(userData);
        SetValue(ptr, "userData", ptrUserData);
        SetValue(ptr, "type", voidPtrType);
        SetValue(ptrUserData, "type", voidPtrType);
        SetValue(ptr, "callback", callback);

        return scope.Escape(ptr);
    };
}
