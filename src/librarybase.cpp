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
    auto f = tmpl->GetFunction();

    SetPrototypeMethod(tmpl, "initialize", initialize);
    SetPrototypeMethod(tmpl, "free", free);
    //f->Set(Nan::New("create").ToLocalChecked(), Nan::New<FunctionTemplate>(Create)->GetFunction());

    constructor.Reset(f);
    SetValue(target, "LibraryBase", f);
}

NAN_METHOD(LibraryBase::New)
{
    auto libraryBase = new LibraryBase();
    libraryBase->Wrap(info.Holder());
    info.GetReturnValue().Set(info.Holder());
}

LibraryBase::LibraryBase()
{

}

LibraryBase::~LibraryBase()
{

}

NAN_METHOD(LibraryBase::initialize)
{
    auto self = info.This().As<Object>();
    auto obj = ObjectWrap::Unwrap<LibraryBase>(self);

    obj->pLib = FindPLib(self);
}

NAN_METHOD(LibraryBase::free)
{
    auto self = info.This().As<Object>();
    auto obj = ObjectWrap::Unwrap<LibraryBase>(self);

    obj->pLib = nullptr;
}

DLLib* LibraryBase::FindPLib(const v8::Local<Object>& self)
{
    Nan::HandleScope scope;

    auto ref = GetValue(self, "_pLib");
    assert(Buffer::HasInstance(ref));
    auto pLib = UnwrapPointer<DLLib>(ref);
    assert(pLib);
    return pLib;
}
