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
#include <dyncall.h>

namespace fastcall {
inline uint8_t dcCallUInt8(DCCallVM* vm, void* f)
{
    int8_t tmp = dcCallInt8(vm, f);
    return reinterpret_cast<uint8_t&>(tmp);
}

inline bool dcCallBoolean(DCCallVM* vm, void* f)
{
    int8_t tmp = dcCallInt8(vm, f);
    return (bool)tmp;
}

inline uint16_t dcCallUInt16(DCCallVM* vm, void* f)
{
    int16_t tmp = dcCallInt16(vm, f);
    return reinterpret_cast<uint16_t&>(tmp);
}

inline uint32_t dcCallUInt32(DCCallVM* vm, void* f)
{
    int32_t tmp = dcCallInt32(vm, f);
    return reinterpret_cast<uint32_t&>(tmp);
}

inline uint64_t dcCallUInt64(DCCallVM* vm, void* f)
{
    int64_t tmp = dcCallInt64(vm, f);
    return reinterpret_cast<uint64_t&>(tmp);
}

#define dcCallByte dcCallUInt8

inline unsigned char dcCallUChar(DCCallVM* vm, void* f)
{
    char tmp = dcCallChar(vm, f);
    return reinterpret_cast<unsigned char&>(tmp);
}

inline unsigned short dcCallUShort(DCCallVM* vm, void* f)
{
    short tmp = dcCallShort(vm, f);
    return reinterpret_cast<unsigned short&>(tmp);
}

inline unsigned int dcCallUInt(DCCallVM* vm, void* f)
{
    int tmp = dcCallInt(vm, f);
    return reinterpret_cast<unsigned int&>(tmp);
}

inline unsigned long dcCallULong(DCCallVM* vm, void* f)
{
    long tmp = dcCallLong(vm, f);
    return reinterpret_cast<unsigned long&>(tmp);
}

inline unsigned long long dcCallULongLong(DCCallVM* vm, void* f)
{
    long long tmp = dcCallLongLong(vm, f);
    return reinterpret_cast<unsigned long long&>(tmp);
}

inline size_t dcCallSizeT(DCCallVM* vm, void* f)
{
    long long tmp = dcCallLongLong(vm, f);
    return reinterpret_cast<size_t&>(tmp);
}
}
