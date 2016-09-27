#pragma once
#include <nan.h>
#include <dyncall.h>
#include "asyncresultbase.h"
#include <string>
#include <exception>

namespace fastcall {
inline void* GetPointer(v8::Local<v8::Value>& val)
{
    using namespace v8;
    using namespace node;
    using namespace std;

    Nan::HandleScope scope;

    if (val->IsNull() || val->IsUndefined()) {
        return nullptr;
    }
    auto obj = val.As<Object>();
    if (!Buffer::HasInstance(obj)) {
        throw logic_error("Value is not a pointer.");
    }
    return reinterpret_cast<void*>(Buffer::Data(obj));
}

inline void* GetPointerAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    using namespace std;

    Nan::HandleScope scope;

    try {
        auto val = info[index];
        return GetPointer(val);
    }
    catch (logic_error&) {
        throw logic_error(string("Argument at index ") + to_string(index) + " is not a pointer.");
    }
}

inline int8_t GetInt8(v8::Local<v8::Value>& val)
{
    return static_cast<int8_t>(val->Int32Value());
}

inline int8_t GetInt8At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int8_t>(info[index]->Int32Value());
}

inline uint8_t GetUInt8(v8::Local<v8::Value>& val)
{
    return static_cast<uint8_t>(val->Uint32Value());
}

inline uint8_t GetUInt8At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<uint8_t>(info[index]->Uint32Value());
}

inline int16_t GetInt16(v8::Local<v8::Value>& val)
{
    return static_cast<int16_t>(val->Int32Value());
}

inline int16_t GetInt16At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int16_t>(info[index]->Int32Value());
}

inline uint16_t GetUInt16(v8::Local<v8::Value>& val)
{
    return static_cast<uint16_t>(val->Uint32Value());
}

inline uint16_t GetUInt16At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<uint16_t>(info[index]->Uint32Value());
}

inline int32_t GetInt32(v8::Local<v8::Value>& val)
{
    return static_cast<int32_t>(val->Int32Value());
}

inline int32_t GetInt32At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int32_t>(info[index]->Int32Value());
}

inline uint32_t GetUInt32(v8::Local<v8::Value>& val)
{
    return static_cast<uint32_t>(val->Uint32Value());
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

inline float GetFloat(v8::Local<v8::Value>& val)
{
    return static_cast<float>(val->NumberValue());
}

inline float GetFloatAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<float>(info[index]->NumberValue());
}

inline double GetDouble(v8::Local<v8::Value>& val)
{
    return val->NumberValue();
}

inline double GetDoubleAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return info[index]->NumberValue();
}

inline char GetChar(v8::Local<v8::Value>& val)
{
    return static_cast<char>(GetInt16(val));
}

inline char GetCharAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<char>(GetInt16At(info, index));
}

inline unsigned char GetUChar(v8::Local<v8::Value>& val)
{
    return static_cast<unsigned char>(GetUInt16(val));
}

inline unsigned char GetUCharAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned char>(GetUInt16At(info, index));
}

inline uint8_t GetByte(v8::Local<v8::Value>& val)
{
    return GetUInt8(val);
}

inline uint8_t GetByteAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return GetUInt8At(info, index);
}

inline short GetShort(v8::Local<v8::Value>& val)
{
    return static_cast<short>(GetInt16(val));
}

inline short GetShortAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<short>(GetInt16At(info, index));
}

inline unsigned short GetUShort(v8::Local<v8::Value>& val)
{
    return static_cast<unsigned short>(GetUInt16(val));
}

inline unsigned short GetUShortAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned short>(GetUInt16At(info, index));
}

inline int GetInt(v8::Local<v8::Value>& val)
{
    return static_cast<int>(GetInt32(val));
}

inline int GetIntAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int>(GetInt32At(info, index));
}

inline unsigned int GetUInt(v8::Local<v8::Value>& val)
{
    return static_cast<unsigned int>(GetUInt32(val));
}

inline unsigned int GetUIntAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned int>(GetUInt32At(info, index));
}

inline long GetLong(v8::Local<v8::Value>& val)
{
    return static_cast<long>(GetInt64(val));
}

inline long GetLongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<long>(GetInt64At(info, index));
}

inline unsigned long GetULong(v8::Local<v8::Value>& val)
{
    return static_cast<unsigned long>(GetUint64(val));
}

inline unsigned long GetULongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned long>(GetUInt64At(info, index));
}

inline long long GetLongLong(v8::Local<v8::Value>& val)
{
    return static_cast<long long>(GetInt64(val));
}

inline long long GetLongLongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<long long>(GetInt64At(info, index));
}

inline unsigned long long GetULongLong(v8::Local<v8::Value>& val)
{
    return static_cast<unsigned long long>(GetUint64(val));
}

inline unsigned long long GetULongLongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned long long>(GetUInt64At(info, index));
}

inline size_t GetSizeT(v8::Local<v8::Value>& val)
{
    return static_cast<size_t>(GetUint64(val));
}

inline size_t GetSizeTAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<size_t>(GetUInt64At(info, index));
}

inline bool GetBool(v8::Local<v8::Value>& val)
{
    return val->BooleanValue();
}

inline bool GetBoolAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return info[index]->BooleanValue();
}
}
