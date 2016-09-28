#include "callbackbase.h"
#include "deps.h"
#include "librarybase.h"
#include "helpers.h"
#include "defs.h"

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
    Nan::SetPrototypeTemplate(tmpl, Nan::New("factory").ToLocalChecked(), Nan::New<FunctionTemplate>(factory), v8::ReadOnly);

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

NAN_METHOD(CallbackBase::initialize)
{
    auto self = info.This().As<Object>();
    auto obj = GetCallbackBase(self);

    if (obj->initialized) {
        return;
    }

    try {
        obj->callbackFactory = MakeCallbackFactory(self);
    }
    catch (exception& ex) {
        return Nan::ThrowError(ex.what());
    }

    obj->initialized = true;
}

NAN_METHOD(CallbackBase::factory)
{
    auto self = info.This().As<Object>();
    auto obj = GetCallbackBase(self);

    if (!obj->initialized) {
        return Nan::ThrowError("Callback is not initialized.");
    }

    if (!info[0]->IsFunction()) {
        return Nan::ThrowTypeError("1st argument is not a function.");
    }

    auto jsFunc = info[0].As<Function>();

    try {
        Local<Object> ptr = obj->callbackFactory(jsFunc);
        info.GetReturnValue().Set(ptr);
    }
    catch (exception& ex) {
        return Nan::ThrowError(ex.what());
    }
}

DCCallback* CallbackBase::GetPtr(const v8::Local<Object>& ptrBuffer)
{
    Nan::HandleScope scope;

    auto type = GetValue(ptrBuffer, "type").As<Object>();

    if (!type.IsEmpty() && type->IsObject() && Buffer::HasInstance(ptrBuffer)) {
        auto typeName = string(*Nan::Utf8String(GetValue(type, "name")));
        auto indirection = GetValue(ptrBuffer, "indirection")->Uint32Value();

        if (typeName == "void" && indirection == 2) {
            auto callbackObj = GetValue(ptrBuffer, "callback");
            if (callbackObj->IsObject()) {
                auto cb = AsCallbackBase(callbackObj.As<Object>());
                if (cb == this) {
                    return reinterpret_cast<DCCallback*>(Buffer::Data(ptrBuffer));
                }
            }
            throw logic_error("Argument is not a valid function pointer.");
        }
        else {
            throw logic_error("Argument is not a valid pointer.");
        }
    }
    else {
        throw logic_error("Argument is not a pointer.");
    }
}
