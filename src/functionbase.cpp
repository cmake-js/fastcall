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
    functionBase->Wrap(info.Holder());
    info.GetReturnValue().Set(info.Holder());
}

FunctionBase::FunctionBase()
{
}

FunctionBase::~FunctionBase()
{
    if (vm) {
        dcFree(vm);
        vm = nullptr;
    }
}

void* FunctionBase::FindFuncPtr(const v8::Local<v8::Object>& self)
{
    Nan::HandleScope scope;

    auto ref = GetValue(self, "_ptr");
    assert(Buffer::HasInstance(ref));
    auto ptr = UnwrapPointer<void>(ref);
    assert(ptr);
    return ptr;
}

NAN_METHOD(FunctionBase::initialize)
{
    auto self = info.This().As<Object>();
    auto obj = ObjectWrap::Unwrap<FunctionBase>(self);
    unsigned callMode = GetValue(self, "callMode")->Uint32Value();

    if (obj->initialized) {
        return;
    }

    obj->library = FindLibraryBase(info.This());
    obj->vmInitializer = MakeVMInitializer(info.This());
    // TODO: implement async
    obj->vmInvoker = callMode == 1 ? MakeSyncVMInvoker(info.This()) : MakeSyncVMInvoker(info.This());
    // TODO: make size parameter + add GC memory usage
    obj->vm = dcNewCallVM(4096);
    obj->initialized = true;
}

NAN_METHOD(FunctionBase::call)
{
    auto self = info.This().As<Object>();
    auto obj = ObjectWrap::Unwrap<FunctionBase>(self);

    if (!obj->initialized) {
        return Nan::ThrowError("Function is not initialized.");
    }

    Local<Value> result;
    try {
        obj->vmInitializer(obj->vm, info);
        result = obj->vmInvoker(obj->vm);
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
    auto ptr = ObjectWrap::Unwrap<LibraryBase>(library);
    assert(ptr);
    return ptr;
}
