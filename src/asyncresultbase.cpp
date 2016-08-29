#include "asyncresultbase.h"
#include "deps.h"
#include "helpers.h"
#include "librarybase.h"
#include "functionbase.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

Nan::Persistent<Function> AsyncResultBase::constructor;

NAN_MODULE_INIT(AsyncResultBase::Init)
{
    Nan::HandleScope scope;

    auto tmpl = Nan::New<FunctionTemplate>(New);
    tmpl->SetClassName(Nan::New("AsyncResultBase").ToLocalChecked());
    tmpl->InstanceTemplate()->SetInternalFieldCount(1);

    auto f = tmpl->GetFunction();
    constructor.Reset(f);
    SetValue(target, "AsyncResultBase", f);
}

NAN_METHOD(AsyncResultBase::New)
{
    //super(func, ref.alloc(type))
    assert(info.Length() == 2);
    
    auto self = info.Holder();
    
    assert(info[0]->IsObject());
    SetValue(self, "func", info[0]);
    auto func = FunctionBase::GetFunctionBase(info[0].As<Object>());
    assert(func);
    
    auto ptr = UnwrapPointer(info[1]);
    SetValue(self, "ptr", info[1]);
    assert(ptr);
    
    auto asyncResultBase = new AsyncResultBase(func, ptr);
    asyncResultBase->Wrap(self);
    info.GetReturnValue().Set(self);
}

AsyncResultBase::AsyncResultBase(FunctionBase* func, void* ptr)
    : func(func)
    , ptr(ptr)
{
    assert(func);
    assert(ptr);
}

AsyncResultBase::~AsyncResultBase()
{
}

AsyncResultBase* AsyncResultBase::GetAsyncResultBase(const v8::Local<v8::Object>& self)
{
    auto obj = ObjectWrap::Unwrap<AsyncResultBase>(self);
    assert(obj);
    return obj;
}
