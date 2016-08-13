#include "deps.h"
#include "dynloadStuff.h"
#include "helpers.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace fastcall;

namespace {

// dynload:
NAN_METHOD(loadLibrary)
{
    char* str = *Nan::Utf8String(info[0]);
    DLLib* pLib = dlLoadLibrary(str);
    if (!pLib) {
        return Nan::ThrowTypeError((string("Cannot load library or library not found: ") + str).c_str());
    }
    return info.GetReturnValue().Set(WrapPointer(pLib));
}

NAN_METHOD(freeLibrary)
{
    DLLib* pLib = unwrapPointer<DLLib>(info[0]);
    if (!pLib) {
        return Nan::ThrowTypeError("Argument value is null or not a pointer.");
    }
    dlFreeLibrary(pLib);
    return info.GetReturnValue().SetUndefined();
}

NAN_METHOD(findSymbol)
{
    DLLib* pLib = unwrapPointer<DLLib>(info[0]);
    if (!pLib) {
        return Nan::ThrowTypeError("First argument's value is null or not a pointer.");
    }
    char* str = *Nan::Utf8String(info[1]);
    void* pF = dlFindSymbol(pLib, str);
    if (!pF) {
        return info.GetReturnValue().Set(Nan::Null());
    }
    return info.GetReturnValue().Set(WrapPointer(pF));
}
}

NAN_MODULE_INIT(fastcall::InitDyncallStuff)
{
    Nan::HandleScope scope;
    Nan::Set(target, Nan::New<String>("loadLibrary").ToLocalChecked(), Nan::New<FunctionTemplate>(loadLibrary)->GetFunction());
    Nan::Set(target, Nan::New<String>("freeLibrary").ToLocalChecked(), Nan::New<FunctionTemplate>(freeLibrary)->GetFunction());
    Nan::Set(target, Nan::New<String>("findSymbol").ToLocalChecked(), Nan::New<FunctionTemplate>(findSymbol)->GetFunction());
}
