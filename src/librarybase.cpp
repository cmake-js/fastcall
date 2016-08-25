#include "librarybase.h"
#include "deps.h"
#include "helpers.h"
#include "loop.h"

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
    obj->loop = nullptr;
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

Lock LibraryBase::AcquireLock()
{
    return Lock(locker);
}

void LibraryBase::EnsureAsyncSupport()
{
    assert(pLib);
    loop = unique_ptr<Loop>(new Loop(4096));
}

