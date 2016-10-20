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
    Nan::SetPrototypeTemplate(tmpl, Nan::New("_synchronize").ToLocalChecked(), Nan::New<FunctionTemplate>(_synchronize), v8::ReadOnly);

    auto f = tmpl->GetFunction();
    constructor.Reset(f);
    SetValue(target, "LibraryBase", f);
}

NAN_METHOD(LibraryBase::New)
{
    if (info.IsConstructCall()) {
        auto libraryBase = new LibraryBase();
        libraryBase->Wrap(info.This());
        info.GetReturnValue().Set(info.This());
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
    obj->loop = nullptr;

    info.GetReturnValue().SetUndefined();
}

NAN_METHOD(LibraryBase::_synchronize)
{
    auto obj = ObjectWrap::Unwrap<LibraryBase>(info.Holder());
    auto self = info.This().As<Object>();

    if (!info[0]->IsFunction()) {
        return Nan::ThrowTypeError("First argument must be a callback function!");
    }

    obj->EnsureAsyncSupport();
    auto callback = info[0].As<Function>();
    obj->loop->Synchronize(callback);

    info.GetReturnValue().SetUndefined();
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
    if (!loop) {
        loop = unique_ptr<Loop>(new Loop(this, 4096));
    }
}
