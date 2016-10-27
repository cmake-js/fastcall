#pragma once
#include <nan.h>

namespace fastcall {
inline void Noop(char* data, void* hint) {}

inline v8::Local<v8::Object> WrapPointer(char* ptr, size_t length = 0)
{
    if (ptr == nullptr)
        length = 0;
    return Nan::NewBuffer(ptr, length, Noop, nullptr).ToLocalChecked();
}

inline v8::Local<v8::Object> WrapNullPointer()
{
    return WrapPointer((char*)nullptr, (size_t)0);
}

inline char* UnwrapPointer(const v8::Local<v8::Value>& value)
{
	assert(value->IsObject() && node::Buffer::HasInstance(value));
    return node::Buffer::Data(value);
}

template <typename T>
inline v8::Local<v8::Object> Wrap(T* object)
{
    assert(object);

    return
        Nan::NewBuffer(
           reinterpret_cast<char*>(object),
            0,
            [](char* data, void* hint) {
                delete reinterpret_cast<T*>(data);
            },
            nullptr)
            .ToLocalChecked();
}

template <typename T>
inline v8::Local<v8::Object> Wrap(T* object, Nan::FreeCallback freeFunction)
{
    assert(object);

    return
        Nan::NewBuffer(
           reinterpret_cast<char*>(object),
            0,
            freeFunction,
            nullptr)
            .ToLocalChecked();
}

template <typename T>
inline T* Unwrap(const v8::Local<v8::Value>& value)
{
    assert(value->IsObject() && node::Buffer::HasInstance(value));
	auto data = node::Buffer::Data(value);
    auto ptr = reinterpret_cast<T*>(data);
	return ptr;
}

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
v8::Local<v8::Object> WrapPointer(T* ptr, size_t length = 0)
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

inline v8::Local<v8::Object> GetGlobal()
{
    return Nan::GetCurrentContext()->Global();
}

inline void DeleteUVAsyncHandle(uv_handle_t* handle)
{
    delete (uv_async_t*)handle;
}

bool InstanceOf(const v8::Local<v8::Object>& obj, v8::Local<v8::Function> ctor);
}
