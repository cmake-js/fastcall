#include "functionbase.h"
#include "deps.h"

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

    //SetPrototypeMethod(tpl, "getHandle", GetHandle);
    //f->Set(Nan::New("create").ToLocalChecked(), Nan::New<FunctionTemplate>(Create)->GetFunction());

    constructor.Reset(f);
    Nan::Set(target, Nan::New<String>("FunctionBase").ToLocalChecked(), f);
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
