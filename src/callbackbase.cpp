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
    auto self = info.This().As<Object>();
    SetValue(self, "_callback", info[0]);
    auto callbackBase = new CallbackBase();
    callbackBase->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
}

bool CallbackBase::IsCallbackBase(const v8::Local<Object>& _base)
{
    Nan::HandleScope scope;

    return InstanceOf(_base, Nan::New(constructor));
}

CallbackBase* CallbackBase::AsCallbackBase(const v8::Local<Object>& _callback)
{
    if (_callback->IsObject()) {
        auto _base = GetValue<Object>(_callback, "_base");
        if (IsCallbackBase(_base)) {
            return GetCallbackBase(_base);
        }
    }
    return nullptr;
}

CallbackBase* CallbackBase::GetCallbackBase(const v8::Local<v8::Object>& _base)
{
    auto obj = Nan::ObjectWrap::Unwrap<CallbackBase>(_base);
    assert(obj);
    return obj;
}

Local<Object> CallbackBase::FindLibrary(const Local<Object>& _base)
{
    Nan::EscapableHandleScope scope;

    auto library = GetValue<Object>(GetValue<Object>(_base, "_callback"), "library");
    return scope.Escape(library);
}

LibraryBase* CallbackBase::FindLibraryBase(const Local<Object>& _base)
{
    Nan::HandleScope scope;

    auto library = FindLibrary(_base);
    return LibraryBase::FindLibraryBase(library);
}

NAN_METHOD(CallbackBase::initialize)
{
    auto self = info.This().As<Object>();
    auto obj = GetCallbackBase(self);

    if (obj->initialized) {
        return;
    }

    try {
        obj->library = FindLibraryBase(self);
        assert(obj->library);
        obj->callbackFactory = MakeCallbackFactory(self, obj->library->GetLoop());
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
        Local<Object> ptr = obj->callbackFactory(self, jsFunc);
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
        auto typeName = string(*Nan::Utf8String(GetValue<String>(type, "name")));
        auto indirection = GetValue(type, "indirection")->Uint32Value();

        if (typeName == "void*" && indirection == 2) {
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
