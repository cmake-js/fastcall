#include "functionbase.h"
#include "deps.h"
#include "librarybase.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

Nan::Persistent<Function> FunctionBase::constructor;

NAN_MODULE_INIT(FunctionBase::Init)
{
    Nan::HandleScope scope;

    auto tmpl = Nan::New<FunctionTemplate>(New);
    tmpl->SetClassName(Nan::New("FunctionBase").ToLocalChecked());
    tmpl->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeTemplate(tmpl, Nan::New("initialize").ToLocalChecked(), Nan::New<FunctionTemplate>(initialize), v8::ReadOnly);
    Nan::SetPrototypeTemplate(tmpl, Nan::New("call").ToLocalChecked(), Nan::New<FunctionTemplate>(call), v8::ReadOnly);

    auto f = tmpl->GetFunction();
    constructor.Reset(f);
    SetValue(target, "FunctionBase", f);
}

NAN_METHOD(FunctionBase::New)
{
    auto functionBase = new FunctionBase();
    functionBase->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

void* FunctionBase::GetFuncPtr(const v8::Local<v8::Object>& self)
{
    Nan::HandleScope scope;

    auto ref = GetValue(self, "_ptr");
    assert(Buffer::HasInstance(ref));
    auto ptr = UnwrapPointer<void>(ref);
    assert(ptr);
    return ptr;
}

FunctionBase* FunctionBase::GetFunctionBase(const v8::Local<v8::Object>& self)
{
    auto obj = Nan::ObjectWrap::Unwrap<FunctionBase>(self);
    assert(obj);
    return obj;
}

NAN_METHOD(FunctionBase::initialize)
{
    auto self = info.This().As<Object>();
    auto obj = GetFunctionBase(self);

    if (obj->initialized) {
        return;
    }

    try {
        // TODO: make size parameter + add GC memory usage
        obj->vm = shared_ptr<DCCallVM>(dcNewCallVM(4096), dcFree);
        obj->library = FindLibraryBase(info.This());
        obj->invoker = MakeFunctionInvoker(info.This());
    }
    catch(exception& ex) {
        Nan::ThrowError(ex.what());
    }

    obj->initialized = true;
}

NAN_METHOD(FunctionBase::call)
{
    auto self = info.This().As<Object>();
    auto obj = GetFunctionBase(self);

    if (!obj->initialized) {
        return Nan::ThrowError("Function is not initialized.");
    }

    Local<Value> result;
    try {
        result = obj->invoker(info);
    }
    catch (exception& ex) {
        return Nan::ThrowError(ex.what());
    }
    info.GetReturnValue().Set(result);
}

Local<Object> FunctionBase::FindLibrary(const Local<Object>& self)
{
    Nan::EscapableHandleScope scope;

    auto library = GetValue<Object>(self, "library");
    return scope.Escape(library);
}

LibraryBase* FunctionBase::FindLibraryBase(const Local<Object>& self)
{
    Nan::HandleScope scope;

    auto library = FindLibrary(self);
    auto ptr = Nan::ObjectWrap::Unwrap<LibraryBase>(library);
    assert(ptr);
    return ptr;
}
