#pragma once
#include <nan.h>

namespace fastcall
{
struct LibraryBase;
struct FunctionBase;

struct AsyncResultBase : public node::ObjectWrap
{
    AsyncResultBase(const AsyncResultBase&) = delete;
    AsyncResultBase(AsyncResultBase&&) = delete;
    ~AsyncResultBase();
    
    static NAN_MODULE_INIT(Init);
    
    static AsyncResultBase* GetAsyncResultBase(const v8::Local<v8::Object>& self);
    
private:
    AsyncResultBase(FunctionBase* func, void* ptr);

    static Nan::Persistent<v8::Function> constructor;
    
    FunctionBase* func = nullptr;
    void* ptr = nullptr;

    static NAN_METHOD(New);
};
}
