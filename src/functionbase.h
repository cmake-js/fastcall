#pragma once
#include <nan.h>
#include "vmaccessors.h"
#include <dyncall.h>

namespace fastcall {
struct LibraryBase;

struct FunctionBase : public node::ObjectWrap {
    FunctionBase(const FunctionBase&) = delete;
    FunctionBase(FunctionBase&&) = delete;
    ~FunctionBase();

    static NAN_MODULE_INIT(Init);

    static void* FindFuncPtr(const v8::Local<v8::Object>& self);

private:
    FunctionBase();

    static Nan::Persistent<v8::Function> constructor;

    bool initialized = false;
    LibraryBase* library = nullptr;
    DCCallVM* vm = nullptr;
    TVMInitialzer vmInitializer;
    TVMInvoker vmInvoker;

    static NAN_METHOD(New);

    static NAN_METHOD(initialize);
    static NAN_METHOD(call);

    static v8::Local<v8::Object> FindLibrary(const v8::Local<v8::Object>& self);
    static LibraryBase* FindLibraryBase(const v8::Local<v8::Object>& self);
};
}
