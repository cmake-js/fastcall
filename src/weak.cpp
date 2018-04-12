#include "weak.h"
#include "deps.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace fastcall;

namespace {

struct WatchStuff {
    WatchStuff(Local<Object> obj, Local<Function> callback)
        : persistentObj(obj)
        , callback(callback)
    {
        persistentObj.SetWeak<WatchStuff>(this, WeakCallback, Nan::WeakCallbackType::kParameter);
    }

    ~WatchStuff()
    {
        callback.Reset();
    }

    Nan::Persistent<Object> persistentObj;
    Nan::Persistent<Function> callback;

    static void WeakCallback(const Nan::WeakCallbackInfo<WatchStuff>& data)
    {
        WatchStuff* self = data.GetParameter();

        Nan::HandleScope scope;
        Nan::New(self->callback)->Call(Nan::Undefined(), 0, nullptr);

        delete self;
    }
};

NAN_METHOD(watch)
{
    if (!info[0]->IsObject()) {
        return Nan::ThrowTypeError("1st argument is not an object.");
    }
    if (!info[1]->IsFunction()) {
        return Nan::ThrowTypeError("2nd argument is not a function.");
    }

    new WatchStuff(info[0].As<Object>(), info[1].As<Function>());
}

NAN_METHOD(adjustExternalMemory)
{
    if (!info[0]->IsNumber()) {
        return Nan::ThrowTypeError("1st argument is not a number.");
    }

    info.GetReturnValue().Set(Nan::New((unsigned)Nan::AdjustExternalMemory(info[0]->Uint32Value())));
}

}

NAN_MODULE_INIT(fastcall::InitWeak)
{
    auto weak = Nan::New<Object>();
    Nan::Set(target, Nan::New<String>("weak").ToLocalChecked(), weak);
    Nan::Set(weak, Nan::New<String>("watch").ToLocalChecked(), Nan::New<FunctionTemplate>(watch)->GetFunction());
    Nan::Set(weak, Nan::New<String>("adjustExternalMemory").ToLocalChecked(), Nan::New<FunctionTemplate>(adjustExternalMemory)->GetFunction());
}
