#include "asyncresultbase.h"
#include "deps.h"
#include "helpers.h"
#include "librarybase.h"
#include "functionbase.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

Nan::Persistent<Function> AsyncResultBase::constructor;

NAN_MODULE_INIT(AsyncResultBase::Init)
{
    Nan::HandleScope scope;

    auto tmpl = Nan::New<FunctionTemplate>(New);
    tmpl->SetClassName(Nan::New("AsyncResultBase").ToLocalChecked());
    tmpl->InstanceTemplate()->SetInternalFieldCount(1);

    auto f = tmpl->GetFunction();
    constructor.Reset(f);
    SetValue(target, "AsyncResultBase", f);
}

NAN_METHOD(AsyncResultBase::New)
{
    auto self = info.This();
    auto _asyncResult = info[0].As<Object>();
    auto func = GetValue<Object>(_asyncResult, "func");
    auto func_base = GetValue<Object>(func, "_base");
    auto funcBase = FunctionBase::GetFunctionBase(func_base);
    auto ptr = UnwrapPointer(GetValue<Object>(_asyncResult, "ptr"));
    assert(ptr);
    
    SetValue(self, "_asyncResult", _asyncResult);
    
    auto asyncResultBase = new AsyncResultBase(funcBase, ptr);
    asyncResultBase->Wrap(self);

    info.GetReturnValue().Set(self);
}

AsyncResultBase::AsyncResultBase(FunctionBase* func, void* ptr)
    : func(func)
    , ptr(ptr)
{
    assert(func);
    assert(ptr);
}

bool AsyncResultBase::IsAsyncResultBase(const v8::Local<Object>& _base)
{
    return InstanceOf(_base, Nan::New<Function>(constructor));
}

AsyncResultBase* AsyncResultBase::GetAsyncResultBase(const v8::Local<v8::Object>& _base)
{
    return Nan::ObjectWrap::Unwrap<AsyncResultBase>(_base);
}

AsyncResultBase* AsyncResultBase::AsAsyncResultBase(const v8::Local<v8::Object>& _asyncResult)
{
    Nan::HandleScope scope;
    if (_asyncResult->IsObject()) {
        auto _base = GetValue<Object>(_asyncResult, "_base");
        if (IsAsyncResultBase(_base)) {
            return GetAsyncResultBase(_base);
        }
    }
    return nullptr;
}
