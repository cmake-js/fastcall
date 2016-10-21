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
    auto self = info.This().As<Object>();
    SetValue(self, "_func", info[0]);
    auto functionBase = new FunctionBase();
    functionBase->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

void* FunctionBase::GetFuncPtr(const v8::Local<v8::Object>& _func)
{
    Nan::HandleScope scope;

    auto ref = GetValue(_func, "_ptr");
    assert(Buffer::HasInstance(ref));
    auto ptr = UnwrapPointer<void>(ref);
    assert(ptr);
    return ptr;
}

FunctionBase* FunctionBase::GetFunctionBase(const v8::Local<v8::Object>& _base)
{
    return Nan::ObjectWrap::Unwrap<FunctionBase>(_base);
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
        obj->library = FindLibraryBase(self);
        obj->invoker = MakeFunctionInvoker(self);
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

Local<Object> FunctionBase::FindLibrary(const Local<Object>& _base)
{
    Nan::EscapableHandleScope scope;

    auto _func = GetValue<Object>(_base, "_func");
    auto library = GetValue<Object>(_func, "library");
    assert(library->IsObject() && !library->IsUndefined());
    return scope.Escape(library);
}

LibraryBase* FunctionBase::FindLibraryBase(const Local<Object>& _base)
{
    Nan::HandleScope scope;

    auto library = FindLibrary(_base);
    return LibraryBase::FindLibraryBase(library);
}
