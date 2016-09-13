#pragma once
#include <nan.h>
#include "functioninvokers.h"
#include <dyncall.h>
#include <memory>
#include "instance.h"

namespace fastcall {
struct LibraryBase;

struct FunctionBase : public Nan::ObjectWrap, Instance {
    static NAN_MODULE_INIT(Init);

    static FunctionBase* GetFunctionBase(const v8::Local<v8::Object>& self);
    static void* GetFuncPtr(const v8::Local<v8::Object>& self);
    LibraryBase* GetLibrary();
    DCCallVM* GetVM();

private:
    static Nan::Persistent<v8::Function> constructor;

    bool initialized = false;
    LibraryBase* library = nullptr;
    TFunctionInvoker invoker;
    std::shared_ptr<DCCallVM> vm;

    static NAN_METHOD(New);

    static NAN_METHOD(initialize);
    static NAN_METHOD(call);

    static v8::Local<v8::Object> FindLibrary(const v8::Local<v8::Object>& self);
    static LibraryBase* FindLibraryBase(const v8::Local<v8::Object>& self);
};

inline LibraryBase* FunctionBase::GetLibrary()
{
    assert(library);
    return library;
}

inline DCCallVM* FunctionBase::GetVM()
{
    assert(vm);
    return vm.get();
}
}
