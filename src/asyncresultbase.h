#pragma once
#include <nan.h>
#include "refcountedobjectwrap.h"
#include "instance.h"

namespace fastcall
{
struct LibraryBase;
struct FunctionBase;

struct AsyncResultBase : public Nan::ObjectWrap, RefCountedObjecWrap, Instance
{
    static NAN_MODULE_INIT(Init);
    
    static bool IsAsyncResultBase(const v8::Local<v8::Object>& self);
    static AsyncResultBase* AsAsyncResultBase(const v8::Local<v8::Object>& self);
    static AsyncResultBase* GetAsyncResultBase(const v8::Local<v8::Object>& self);
    template <typename T>
    T* GetPtr();
    
private:
    explicit AsyncResultBase(FunctionBase* func, void* ptr);

    static Nan::Persistent<v8::Function> constructor;
    
    FunctionBase* func = nullptr;
    void* ptr = nullptr;

    static NAN_METHOD(New);
};

template <typename T>
inline T* AsyncResultBase::GetPtr()
{
    return static_cast<T*>(ptr);
}
}
