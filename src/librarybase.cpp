#include "librarybase.h"
#include "deps.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

Nan::Persistent<Function> LibraryBase::constructor;

NAN_MODULE_INIT(LibraryBase::Init)
{
    Nan::HandleScope scope;

    auto tmpl = Nan::New<FunctionTemplate>(New);
    tmpl->SetClassName(Nan::New("LibraryBase").ToLocalChecked());
    tmpl->InstanceTemplate()->SetInternalFieldCount(1);

    Nan::SetPrototypeTemplate(tmpl, Nan::New("initialize").ToLocalChecked(), Nan::New<FunctionTemplate>(initialize), v8::ReadOnly);
    Nan::SetPrototypeTemplate(tmpl, Nan::New("free").ToLocalChecked(), Nan::New<FunctionTemplate>(free), v8::ReadOnly);

    auto f = tmpl->GetFunction();
    constructor.Reset(f);
    SetValue(target, "LibraryBase", f);
}

NAN_METHOD(LibraryBase::New)
{
    if (info.IsConstructCall()) {
        auto self = info.This().As<Object>();
        SetValue(self, "_lib", info[0]);
        auto libraryBase = new LibraryBase();
        libraryBase->Wrap(self);
        info.GetReturnValue().Set(self);
    } else {
        const int argc = 1;
        v8::Local<v8::Value> argv[argc] = { info[0] };
        v8::Local<v8::Function> cons = Nan::New(constructor);
        info.GetReturnValue().Set(cons->NewInstance(argc, argv));
    }
}

NAN_METHOD(LibraryBase::initialize)
{
    auto obj = ObjectWrap::Unwrap<LibraryBase>(info.Holder());
    auto self = info.This().As<Object>();

    obj->pLib = FindPLib(self);

    info.GetReturnValue().SetUndefined();
}

NAN_METHOD(LibraryBase::free)
{
    auto obj = ObjectWrap::Unwrap<LibraryBase>(info.Holder());
    auto self = info.This().As<Object>();

    obj->pLib = nullptr;

    info.GetReturnValue().SetUndefined();
}

DLLib* LibraryBase::FindPLib(const v8::Local<Object>& _base)
{
    Nan::HandleScope scope;

    auto _lib = GetValue<Object>(_base, "_lib");
    auto ref = GetValue(_lib, "_pLib");
    assert(Buffer::HasInstance(ref));
    auto pLib = UnwrapPointer<DLLib>(ref);
    assert(pLib);
    return pLib;
}

LibraryBase* LibraryBase::FindLibraryBase(const Local<Object>& _lib)
{
    auto _base = GetValue<Object>(_lib, "_base");
    return ObjectWrap::Unwrap<LibraryBase>(_base);
}
