/*
Copyright 2016 Gábor Mező (gabor.mezo@outlook.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

#pragma once
#include <nan.h>
#include <dyncall.h>
#include <string>
#include <exception>
#include "int64.h"

namespace fastcall {
inline void* GetPointer(v8::Local<v8::Value> val)
{
    using namespace v8;
    using namespace node;
    using namespace std;

    if (Buffer::HasInstance(val)) {
        return reinterpret_cast<void*>(Buffer::Data(val));;
    }
    if (val->IsNull()) {
        return nullptr;
    }
    throw std::logic_error("Argument is not a pointer or null.");
}

inline int8_t GetInt8(v8::Local<v8::Value> val)
{
    return static_cast<int8_t>(val->Int32Value());
}

inline uint8_t GetUInt8(v8::Local<v8::Value> val)
{
    return static_cast<uint8_t>(val->Uint32Value());
}

inline int16_t GetInt16(v8::Local<v8::Value> val)
{
    return static_cast<int16_t>(val->Int32Value());
}

inline uint16_t GetUInt16(v8::Local<v8::Value> val)
{
    return static_cast<uint16_t>(val->Uint32Value());
}

inline int32_t GetInt32(v8::Local<v8::Value> val)
{
    return static_cast<int32_t>(val->Int32Value());
}

inline uint32_t GetUInt32(v8::Local<v8::Value> val)
{
    return static_cast<uint32_t>(val->Uint32Value());
}

inline int64_t GetInt64At(const Nan::FunctionCallbackInfo<v8::Value> info, const unsigned index)
{
    return GetInt64(info[index]);
}

inline float GetFloat(v8::Local<v8::Value> val)
{
    return static_cast<float>(val->NumberValue());
}

inline double GetDouble(v8::Local<v8::Value> val)
{
    return val->NumberValue();
}

inline char GetChar(v8::Local<v8::Value> val)
{
    return static_cast<char>(GetInt16(val));
}

inline unsigned char GetUChar(v8::Local<v8::Value> val)
{
    return static_cast<unsigned char>(GetUInt16(val));
}

inline uint8_t GetByte(v8::Local<v8::Value> val)
{
    return GetUInt8(val);
}

inline short GetShort(v8::Local<v8::Value> val)
{
    return static_cast<short>(GetInt16(val));
}

inline unsigned short GetUShort(v8::Local<v8::Value> val)
{
    return static_cast<unsigned short>(GetUInt16(val));
}

inline int GetInt(v8::Local<v8::Value> val)
{
    return static_cast<int>(GetInt32(val));
}

inline unsigned int GetUInt(v8::Local<v8::Value> val)
{
    return static_cast<unsigned int>(GetUInt32(val));
}

inline long GetLong(v8::Local<v8::Value> val)
{
    return static_cast<long>(GetInt64(val));
}

inline unsigned long GetULong(v8::Local<v8::Value> val)
{
    return static_cast<unsigned long>(GetUint64(val));
}

inline long long GetLongLong(v8::Local<v8::Value> val)
{
    return static_cast<long long>(GetInt64(val));
}

inline unsigned long long GetULongLong(v8::Local<v8::Value> val)
{
    return static_cast<unsigned long long>(GetUint64(val));
}

inline size_t GetSizeT(v8::Local<v8::Value> val)
{
    return static_cast<size_t>(GetUint64(val));
}

inline bool GetBool(v8::Local<v8::Value> val)
{
    return val->BooleanValue();
}
}
