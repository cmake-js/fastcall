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

    auto ref = Require("ref").As<v8::Object>();
    assert(!ref.IsEmpty());
    return scope.Escape(ref);
}
