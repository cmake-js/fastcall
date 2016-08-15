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
    auto f = tmpl->GetFunction();

    SetPrototypeMethod(tmpl, "initialize", initialize);
    //f->Set(Nan::New("create").ToLocalChecked(), Nan::New<FunctionTemplate>(Create)->GetFunction());

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
}

NAN_METHOD(FunctionBase::initialize)
{
    auto self = info.This().As<Object>();
    auto obj = ObjectWrap::Unwrap<FunctionBase>(self);

    if (obj->initialized) {
        return;
    }

    obj->library = FindLibraryBase(info.This());

    obj->initialized = true;
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
