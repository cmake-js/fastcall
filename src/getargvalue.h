#pragma once
#include <nan.h>
#include <dyncall.h>
#include "asyncresultbase.h"
#include <string>
#include <exception>

namespace fastcall {
inline void* GetPointerAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    using namespace v8;
    using namespace node;
    using namespace std;

    Nan::HandleScope scope;

    auto val = info[index];
    if (val->IsNull() || val->IsUndefined()) {
        return nullptr;
    }
    auto obj = val.As<Object>();
    if (!Buffer::HasInstance(obj)) {
        throw logic_error(string("Argument at index ") + to_string(index) + " is not a pointer.");
    }
    return reinterpret_cast<void*>(Buffer::Data(obj));
}

inline int8_t GetInt8At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int8_t>(info[index]->Int32Value());
}

inline uint8_t GetUInt8At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<uint8_t>(info[index]->Uint32Value());
}

inline int16_t GetInt16At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int16_t>(info[index]->Int32Value());
}

inline uint16_t GetUInt16At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<uint16_t>(info[index]->Uint32Value());
}

inline int32_t GetInt32At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int32_t>(info[index]->Int32Value());
}

inline uint32_t GetUInt32At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<uint32_t>(info[index]->Uint32Value());
}

inline int64_t GetInt64At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return GetInt64(info[index]);
}

inline uint64_t GetUInt64At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return GetUint64(info[index]);
}

inline float GetFloatAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<float>(info[index]->NumberValue());
}

inline double GetDoubleAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return info[index]->NumberValue();
}

inline char GetCharAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<char>(GetInt16At(info, index));
}

inline unsigned char GetUCharAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned char>(GetUInt16At(info, index));
}

inline uint8_t GetByteAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return GetUInt8At(info, index);
}

inline short GetShortAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<short>(GetInt16At(info, index));
}

inline unsigned short GetUShortAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned short>(GetUInt16At(info, index));
}

inline int GetIntAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int>(GetInt32At(info, index));
}

inline unsigned int GetUIntAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned int>(GetUInt32At(info, index));
}

inline long GetLongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<long>(GetInt64At(info, index));
}

inline unsigned long GetULongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned long>(GetUInt64At(info, index));
}

inline long long GetLongLongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<long long>(GetInt64At(info, index));
}

inline unsigned long long GetULongLongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned long long>(GetUInt64At(info, index));
}

inline size_t GetSizeTAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<size_t>(GetUInt64At(info, index));
}

inline bool GetBoolAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return info[index]->BooleanValue();
}

inline AsyncResultBase* AsAsyncResultBase(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    using namespace v8;
    using namespace node;

    Nan::HandleScope scope;

    return AsyncResultBase::AsAsyncResultBase(info[index].As<Object>());
}

template <typename T>
inline T* AsAsyncResultPtr(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    auto basePtr = AsAsyncResultBase(info, index);
    if (!basePtr) {
        return nullptr;
    }
    return basePtr->GetPtr<T>();
}
}
