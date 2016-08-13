#pragma once
#include <nan.h>

namespace fastcall {
inline void Noop(char* data, void* hint) {}

v8::Local<v8::Value> WrapPointer(char* ptr, size_t length = 0);

v8::Local<v8::Value> wrapNullPointer();

char* unwrapPointer(const v8::Local<v8::Value>& value);

template <typename T>
v8::Local<v8::Value> WrapPointer(T* ptr, size_t length = 0)
{
    return WrapPointer(reinterpret_cast<char*>(ptr), length);
}

template <typename T>
T* UnwrapPointer(const v8::Local<v8::Value>& value)
{
    return reinterpret_cast<T*>(UnwrapPointer(value));
}
}
