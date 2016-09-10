#pragma once
#include <nan.h>

namespace fastcall
{
struct LibraryBase;
struct FunctionBase;

struct AsyncResultBase : public Nan::ObjectWrap
{
    AsyncResultBase(const AsyncResultBase&) = delete;
    AsyncResultBase(AsyncResultBase&&) = delete;
    ~AsyncResultBase();
    
    static NAN_MODULE_INIT(Init);
    
    static AsyncResultBase* AsAsyncResultBase(const v8::Local<v8::Object>& self);
    static AsyncResultBase* GetAsyncResultBase(const v8::Local<v8::Object>& self);
    template <typename T>
    T* GetPtr();
    void Release();
    
private:
    static const unsigned typeId = 354366471;

    AsyncResultBase(FunctionBase* func, void* ptr);

    static Nan::Persistent<v8::Function> constructor;
    
    FunctionBase* func = nullptr;
    void* ptr = nullptr;
    Nan::Persistent<v8::Object> me;

    static NAN_METHOD(New);
};

template <typename T>
inline T* AsyncResultBase::GetPtr()
{
    return static_cast<T*>(ptr);
}
}
