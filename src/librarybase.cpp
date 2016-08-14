#include "librarybase.h"
#include "deps.h"

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

    //SetPrototypeMethod(tpl, "getHandle", GetHandle);
    //f->Set(Nan::New("create").ToLocalChecked(), Nan::New<FunctionTemplate>(Create)->GetFunction());

    constructor.Reset(f);
    Nan::Set(target, Nan::New<String>("LibraryBase").ToLocalChecked(), f);
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
