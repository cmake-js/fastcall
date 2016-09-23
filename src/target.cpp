#include "target.h"
#include "deps.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

namespace {
Nan::Persistent<v8::Object> savedTarget;
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

    auto ref = Require("./ref").As<v8::Object>();
    assert(!ref.IsEmpty());
    return scope.Escape(ref);
}

v8::Local<v8::Object> fastcall::DerefType(v8::Local<v8::Object> refType)
{
    Nan::EscapableHandleScope scope;

    auto ref = RequireRef();
    auto derefType = GetValue<Function>(ref, "derefType");
    assert(!derefType.IsEmpty());
    v8::Local<v8::Value> args[] = { refType };
    auto result = Nan::Call(derefType, ref, 1, args).ToLocalChecked().As<Object>();
    assert(!result.IsEmpty());
    return scope.Escape(result);
}

v8::Local<Object> fastcall::MakeAsyncResult(const v8::Local<Object>& func, const v8::Local<Object>& type)
{
    Nan::EscapableHandleScope scope;

    auto target = Nan::New(savedTarget);
    assert(!target.IsEmpty() && target->IsObject());
    auto ctor = GetValue<v8::Function>(target, "AsyncResult");
    v8::Local<v8::Value> args[] = { func, type };
    auto asyncResult = Nan::NewInstance(ctor, 2, args).ToLocalChecked();
    assert(!asyncResult.IsEmpty() && asyncResult->IsObject());

    return scope.Escape(asyncResult);
}
