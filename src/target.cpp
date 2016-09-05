#include "target.h"
#include "deps.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

namespace {
Nan::Persistent<v8::Object> savedTarget;

v8::Local<Value> CallInt64Method(const char* methodName, unsigned argCount, v8::Local<v8::Value>* args)
{
    Nan::EscapableHandleScope scope;

    auto target = Nan::New(savedTarget);
    auto int64 = GetValue(target, "int64").As<Object>();
    assert(!int64.IsEmpty());
    auto result = Nan::Call(GetValue<Function>(int64, methodName), int64, argCount, args).ToLocalChecked();
    assert(!result.IsEmpty());
    return scope.Escape(result);
}
}

NAN_MODULE_INIT(fastcall::InitTarget)
{
    savedTarget.Reset(target);
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

v8::Local<Object> fastcall::RequireRef()
{
    Nan::EscapableHandleScope scope;

    auto ref = Require("ref").As<v8::Object>();
    assert(!ref.IsEmpty());
    return scope.Escape(ref);
}

v8::Local<Value> fastcall::MakeNumber(const v8::Local<Value>& value)
{
    v8::Local<v8::Value> args[] = { value };
    return CallInt64Method("makeNumber", 1, args);
}

v8::Local<Value> fastcall::MakeInt64(int64_t value)
{
    Nan::EscapableHandleScope scope;

    int hiValue = (int)(value >> 32);
    int loValue = (int)(value);
    v8::Local<v8::Value> args[] = { Nan::New(hiValue), Nan::New(loValue) };
    return scope.Escape(CallInt64Method("makeInt64", 2, args));
}

v8::Local<Value> fastcall::MakeUint64(uint64_t value)
{
    Nan::EscapableHandleScope scope;

    unsigned hiValue = (unsigned)(value >> 32);
    unsigned loValue = (unsigned)(value);
    v8::Local<v8::Value> args[] = { Nan::New(hiValue), Nan::New(loValue) };
    return scope.Escape(CallInt64Method("makeUint64", 2, args));
}
