#pragma once
#include <nan.h>

namespace fastcall {
struct FunctionBase : public node::ObjectWrap {
    FunctionBase(const FunctionBase&) = delete;
    FunctionBase(FunctionBase&&) = delete;
    ~FunctionBase();

    static NAN_MODULE_INIT(Init);

private:
    FunctionBase();

    static Nan::Persistent<v8::Function> constructor;

    static NAN_METHOD(New);
};
}
