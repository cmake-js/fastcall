#include "deps.h"
#include "dyncallwrapper.h"
#include "helpers.h"
#include "int64.h"
#include "dcarg.h"
#include "dccall.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace fastcall;

namespace {

DCCallVM* vm = nullptr;

NAN_METHOD(newCallVM)
{
    unsigned size = info[0]->Uint32Value();
    auto ptr = dcNewCallVM(size);
    info.GetReturnValue().Set(WrapPointer(ptr));
}

NAN_METHOD(free)
{
    dcFree(Unwrap<DCCallVM>(info[0]));
}

NAN_METHOD(setVM)
{
    vm = Unwrap<DCCallVM>(info[0]);
}

NAN_METHOD(mode)
{
    dcMode(vm, info[0]->Int32Value());
}

NAN_METHOD(reset)
{
    dcReset(vm);
}

NAN_METHOD(argBool)
{
    dcArgBool(vm, info[0]->BooleanValue());
}

NAN_METHOD(argChar)
{
    dcArgChar(vm, info[0]->Int32Value());
}

NAN_METHOD(argShort)
{
    dcArgShort(vm, info[0]->Int32Value());
}

NAN_METHOD(argInt)
{
    dcArgInt(vm, info[0]->Int32Value());
}

NAN_METHOD(argLong)
{
    dcArgLong(vm, GetInt64(info[0]));
}

NAN_METHOD(argLongLong)
{
    dcArgLongLong(vm, GetInt64(info[0]));
}

NAN_METHOD(argFloat)
{
    dcArgFloat(vm, info[0]->NumberValue());
}

NAN_METHOD(argDouble)
{
    dcArgDouble(vm, info[0]->NumberValue());
}

NAN_METHOD(argPointer)
{
    dcArgPointer(vm, UnwrapPointer(info[0]));
}

NAN_METHOD(argInt8)
{
    dcArgInt8(vm, info[0]->Int32Value());
}

NAN_METHOD(argUInt8)
{
    dcArgUInt8(vm, info[0]->Uint32Value());
}

NAN_METHOD(argInt16)
{
    dcArgInt16(vm, info[0]->Int32Value());
}

NAN_METHOD(argUInt16)
{
    dcArgUInt16(vm, info[0]->Uint32Value());
}

NAN_METHOD(argInt32)
{
    dcArgInt32(vm, info[0]->Int32Value());
}

NAN_METHOD(argUInt32)
{
    dcArgUInt32(vm, info[0]->Uint32Value());
}

NAN_METHOD(argInt64)
{
    dcArgInt64(vm, GetInt64(info[0]));
}

NAN_METHOD(argUInt64)
{
    dcArgUInt64(vm, GetUint64(info[0]));
}

NAN_METHOD(argByte)
{
    dcArgByte(vm, info[0]->Uint32Value());
}

NAN_METHOD(argUChar)
{
    dcArgUChar(vm, info[0]->Uint32Value());
}

NAN_METHOD(argUShort)
{
    dcArgUShort(vm, info[0]->Uint32Value());
}

NAN_METHOD(argUInt)
{
    dcArgUInt(vm, info[0]->Uint32Value());
}

NAN_METHOD(argULong)
{
    dcArgULong(vm, GetUint64(info[0]));
}

NAN_METHOD(argULongLong)
{
    dcArgULongLong(vm, GetUint64(info[0]));
}

NAN_METHOD(argSizeT)
{
    dcArgSizeT(vm, GetUint64(info[0]));
}

NAN_METHOD(callVoid)
{
    dcCallVoid(vm, UnwrapPointer(info[0]));
}

NAN_METHOD(callBool)
{
    auto result = dcCallBool(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callChar)
{
    auto result = dcCallChar(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callShort)
{
    auto result = dcCallShort(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callInt)
{
    auto result = dcCallInt(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callLong)
{
    auto result = dcCallLong(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(MakeInt64(result));
}

NAN_METHOD(callLongLong)
{
    auto result = dcCallLongLong(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(MakeInt64(result));
}

NAN_METHOD(callFloat)
{
    auto result = dcCallFloat(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callDouble)
{
    auto result = dcCallDouble(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callPointer)
{
    auto result = dcCallPointer(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(WrapPointer(result));
}

NAN_METHOD(callInt8)
{
    auto result = dcCallInt8(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callInt16)
{
    auto result = dcCallInt16(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callInt32)
{
    auto result = dcCallInt32(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callInt64)
{
    auto result = dcCallInt64(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(MakeInt64(result));
}

NAN_METHOD(callUInt8)
{
    auto result = dcCallUInt8(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callUInt16)
{
    auto result = dcCallUInt16(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callUInt32)
{
    auto result = dcCallUInt32(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callIntU64)
{
    auto result = dcCallUInt64(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(MakeUint64(result));
}

NAN_METHOD(callByte)
{
    auto result = dcCallByte(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callUChar)
{
    auto result = dcCallUChar(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callUShort)
{
    auto result = dcCallUShort(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callUInt)
{
    auto result = dcCallUInt(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(callULong)
{
    auto result = dcCallULong(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(MakeUint64(result));
}

NAN_METHOD(callULongLong)
{
    auto result = dcCallULongLong(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(MakeUint64(result));
}

NAN_METHOD(callSizeT)
{
    auto result = dcCallSizeT(vm, UnwrapPointer(info[0]));
    info.GetReturnValue().Set(MakeUint64(result));
}
}

NAN_MODULE_INIT(fastcall::InitDyncallWrapper)
{
    Nan::HandleScope scope;
    auto dyncall = Nan::New<Object>();
    Nan::Set(target, Nan::New<String>("dyncall").ToLocalChecked(), dyncall);
    Nan::Set(dyncall, Nan::New<String>("newCallVM").ToLocalChecked(), Nan::New<FunctionTemplate>(newCallVM)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("free").ToLocalChecked(), Nan::New<FunctionTemplate>(free)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("mode").ToLocalChecked(), Nan::New<FunctionTemplate>(mode)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("reset").ToLocalChecked(), Nan::New<FunctionTemplate>(reset)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("setVM").ToLocalChecked(), Nan::New<FunctionTemplate>(setVM)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argBool").ToLocalChecked(), Nan::New<FunctionTemplate>(argBool)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argChar").ToLocalChecked(), Nan::New<FunctionTemplate>(argChar)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argShort").ToLocalChecked(), Nan::New<FunctionTemplate>(argShort)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argInt").ToLocalChecked(), Nan::New<FunctionTemplate>(argInt)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argLong").ToLocalChecked(), Nan::New<FunctionTemplate>(argLong)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argLongLong").ToLocalChecked(), Nan::New<FunctionTemplate>(argLongLong)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argFloat").ToLocalChecked(), Nan::New<FunctionTemplate>(argFloat)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argDouble").ToLocalChecked(), Nan::New<FunctionTemplate>(argDouble)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argPointer").ToLocalChecked(), Nan::New<FunctionTemplate>(argPointer)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argInt8").ToLocalChecked(), Nan::New<FunctionTemplate>(argInt8)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argUInt8").ToLocalChecked(), Nan::New<FunctionTemplate>(argUInt8)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argInt16").ToLocalChecked(), Nan::New<FunctionTemplate>(argInt16)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argUInt16").ToLocalChecked(), Nan::New<FunctionTemplate>(argUInt16)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argInt32").ToLocalChecked(), Nan::New<FunctionTemplate>(argInt32)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argUInt32").ToLocalChecked(), Nan::New<FunctionTemplate>(argUInt32)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argInt64").ToLocalChecked(), Nan::New<FunctionTemplate>(argInt64)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argUInt64").ToLocalChecked(), Nan::New<FunctionTemplate>(argUInt64)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argByte").ToLocalChecked(), Nan::New<FunctionTemplate>(argByte)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argUChar").ToLocalChecked(), Nan::New<FunctionTemplate>(argUChar)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argUShort").ToLocalChecked(), Nan::New<FunctionTemplate>(argUShort)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argUInt").ToLocalChecked(), Nan::New<FunctionTemplate>(argUInt)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argULong").ToLocalChecked(), Nan::New<FunctionTemplate>(argULong)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argULongLong").ToLocalChecked(), Nan::New<FunctionTemplate>(argULongLong)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("argSizeT").ToLocalChecked(), Nan::New<FunctionTemplate>(argSizeT)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callVoid").ToLocalChecked(), Nan::New<FunctionTemplate>(callVoid)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callBool").ToLocalChecked(), Nan::New<FunctionTemplate>(callBool)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callChar").ToLocalChecked(), Nan::New<FunctionTemplate>(callChar)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callShort").ToLocalChecked(), Nan::New<FunctionTemplate>(callShort)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callInt").ToLocalChecked(), Nan::New<FunctionTemplate>(callInt)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callLong").ToLocalChecked(), Nan::New<FunctionTemplate>(callLong)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callLongLong").ToLocalChecked(), Nan::New<FunctionTemplate>(callLongLong)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callFloat").ToLocalChecked(), Nan::New<FunctionTemplate>(callFloat)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callDouble").ToLocalChecked(), Nan::New<FunctionTemplate>(callDouble)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callPointer").ToLocalChecked(), Nan::New<FunctionTemplate>(callPointer)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callInt8").ToLocalChecked(), Nan::New<FunctionTemplate>(callInt8)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callInt16").ToLocalChecked(), Nan::New<FunctionTemplate>(callInt16)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callInt32").ToLocalChecked(), Nan::New<FunctionTemplate>(callInt32)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callInt64").ToLocalChecked(), Nan::New<FunctionTemplate>(callInt64)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callUInt8").ToLocalChecked(), Nan::New<FunctionTemplate>(callUInt8)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callUInt16").ToLocalChecked(), Nan::New<FunctionTemplate>(callUInt16)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callUInt32").ToLocalChecked(), Nan::New<FunctionTemplate>(callUInt32)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callIntU64").ToLocalChecked(), Nan::New<FunctionTemplate>(callIntU64)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callByte").ToLocalChecked(), Nan::New<FunctionTemplate>(callByte)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callUChar").ToLocalChecked(), Nan::New<FunctionTemplate>(callUChar)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callUShort").ToLocalChecked(), Nan::New<FunctionTemplate>(callUShort)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callUInt").ToLocalChecked(), Nan::New<FunctionTemplate>(callUInt)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callULong").ToLocalChecked(), Nan::New<FunctionTemplate>(callULong)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callULongLong").ToLocalChecked(), Nan::New<FunctionTemplate>(callULongLong)->GetFunction());
    Nan::Set(dyncall, Nan::New<String>("callSizeT").ToLocalChecked(), Nan::New<FunctionTemplate>(callSizeT)->GetFunction());
}
