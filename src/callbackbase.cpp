#include "callbackbase.h"
#include "deps.h"
#include "librarybase.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

Nan::Persistent<Function> CallbackBase::constructor;

NAN_MODULE_INIT(CallbackBase::Init)
{
    Nan::HandleScope scope;

    auto tmpl = Nan::New<FunctionTemplate>(New);
    tmpl->SetClassName(Nan::New("CallbackBase").ToLocalChecked());
    tmpl->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeTemplate(tmpl, Nan::New("initialize").ToLocalChecked(), Nan::New<FunctionTemplate>(initialize), v8::ReadOnly);
    Nan::SetPrototypeTemplate(tmpl, Nan::New("makeCallback").ToLocalChecked(), Nan::New<FunctionTemplate>(makeCallback), v8::ReadOnly);

    auto f = tmpl->GetFunction();
    constructor.Reset(f);
    SetValue(target, "CallbackBase", f);
}

NAN_METHOD(CallbackBase::New)
{
    auto callbackBase = new CallbackBase();
    callbackBase->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

bool CallbackBase::IsCallbackBase(const v8::Local<Object>& self)
{
    Nan::HandleScope scope;

    return InstanceOf(self, Nan::New(constructor));
}

CallbackBase* CallbackBase::AsCallbackBase(const v8::Local<Object>& self)
{
    if (IsCallbackBase(self)) {
        return GetCallbackBase(self);
    }
    return nullptr;
}

CallbackBase* CallbackBase::GetCallbackBase(const v8::Local<v8::Object>& self)
{
    auto obj = Nan::ObjectWrap::Unwrap<CallbackBase>(self);
    assert(obj);
    return obj;
}

NAN_METHOD(CallbackBase::initialize)
{
    auto self = info.This().As<Object>();
    auto obj = GetCallbackBase(self);

    if (obj->initialized) {
        return;
    }

    // Init here ...

    obj->initialized = true;
}

NAN_METHOD(CallbackBase::makeCallback)
{
    auto self = info.This().As<Object>();
    auto obj = GetCallbackBase(self);

    if (!obj->initialized) {
        return Nan::ThrowError("Callback is not initialized.");
    }

    if (!info[0]->IsFunction()) {
        return Nan::ThrowTypeError("Argument is not a function.");
    }

    auto jsFunc = info[0].As<Function>();

    info.GetReturnValue().Set(Nan::Undefined());
}

Local<Object> CallbackBase::FindLibrary(const Local<Object>& self)
{
    Nan::EscapableHandleScope scope;

    auto library = GetValue<Object>(self, "library");
    return scope.Escape(library);
}

LibraryBase* CallbackBase::FindLibraryBase(const Local<Object>& self)
{
    Nan::HandleScope scope;

    auto library = FindLibrary(self);
    auto ptr = Nan::ObjectWrap::Unwrap<LibraryBase>(library);
    assert(ptr);
    return ptr;
}
