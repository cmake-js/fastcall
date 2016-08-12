#pragma once
#include <nan.h>

namespace fastcall {
inline void noop(char* data, void* hint) {}

v8::Local<v8::Value> wrapPointer(char* ptr, size_t length = 0);

v8::Local<v8::Value> wrapNullPointer();

char* unwrapPointer(const v8::Local<v8::Value>& value);

template <typename T>
v8::Local<v8::Value> wrapPointer(T* ptr, size_t length = 0)
{
    return wrapPointer(reinterpret_cast<char*>(ptr), length);
}

template <typename T>
T* unwrapPointer(const v8::Local<v8::Value>& value)
{
    return reinterpret_cast<T*>(unwrapPointer(value));
}
}
