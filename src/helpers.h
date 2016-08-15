#pragma once
#include <nan.h>

namespace fastcall {
inline void Noop(char* data, void* hint) {}

v8::Local<v8::Value> WrapPointer(char* ptr, size_t length = 0);

v8::Local<v8::Value> WrapNullPointer();

char* UnwrapPointer(const v8::Local<v8::Value>& value);

template <typename S>
v8::Local<v8::Value> GetValue(const S& value, const char* key)
{
    Nan::EscapableHandleScope scope;

    return scope.Escape(Nan::Get(value, Nan::New(key).ToLocalChecked()).ToLocalChecked());
}

template <typename T, typename S>
v8::Local<T> GetValue(const S& value, const char* key)
{
    Nan::EscapableHandleScope scope;

#if _MSC_VER
    return scope.Escape(Nan::Get(value, Nan::New(key).ToLocalChecked()).ToLocalChecked().As<T>());
#else
    return scope.Escape(Nan::Get(value, Nan::New(key).ToLocalChecked()).ToLocalChecked().template As<T>());
#endif
}

template <typename T, typename S>
void SetValue(T& value, const char* key, const S& v)
{
    Nan::HandleScope scope;

    Nan::Set(value, Nan::New(key).ToLocalChecked(), v);
}

template <typename T>
v8::Local<v8::Value> WrapPointer(T* ptr, size_t length = 0)
{
    Nan::EscapableHandleScope scope;

    return scope.Escape(WrapPointer(reinterpret_cast<char*>(ptr), length));
}

template <typename T>
T* UnwrapPointer(const v8::Local<v8::Value>& value)
{
    Nan::HandleScope scope;

    return reinterpret_cast<T*>(UnwrapPointer(value));
}
}
