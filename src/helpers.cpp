#include "deps.h"
#include "helpers.h"

using namespace std;
using namespace v8;
using namespace fastcall;
using namespace node;

bool fastcall::InstanceOf(const v8::Local<Object>& obj, v8::Local<Function> ctor)
{
    Nan::HandleScope scope;

    auto proto = obj;
    for (;;) {
        if (proto.IsEmpty() || !proto->IsObject()) {
            return false;
        }
        if (GetValue<Function>(proto, "constructor")->Equals(ctor)) {
            return true;
        }
        proto = proto->GetPrototype().As<Object>();
    }
    return true;
}
