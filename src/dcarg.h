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
#define dcArgInt8 dcArgChar

inline void dcArgUInt8(DCCallVM* vm, unsigned char p)
{
    dcArgChar(vm, reinterpret_cast<char&>(p));
}

inline void dcArgBoolean(DCCallVM* vm, bool p)
{
    dcArgChar(vm, (char)p);
}

#define dcCallInt8 dcCallChar

#define dcArgInt16 dcArgShort

inline void dcArgUInt16(DCCallVM* vm, unsigned short p)
{
    dcArgShort(vm, reinterpret_cast<short&>(p));
}

#define dcCallInt16 dcCallShort

#define dcArgInt32 dcArgInt

inline void dcArgUInt32(DCCallVM* vm, unsigned int p)
{
    dcArgInt(vm, reinterpret_cast<int&>(p));
}

#define dcCallInt32 dcCallInt

#define dcArgInt64 dcArgLongLong

inline void dcArgUInt64(DCCallVM* vm, unsigned long long p)
{
    dcArgLongLong(vm, reinterpret_cast<long long&>(p));
}

#define dcCallInt64 dcCallLongLong

#define dcArgByte dcArgUInt8

inline void dcArgUChar(DCCallVM* vm, unsigned char p)
{
    dcArgChar(vm, reinterpret_cast<char&>(p));
}

inline void dcArgUShort(DCCallVM* vm, unsigned short p)
{
    dcArgShort(vm, reinterpret_cast<short&>(p));
}

inline void dcArgUInt(DCCallVM* vm, unsigned int p)
{
    dcArgInt(vm, reinterpret_cast<int&>(p));
}

inline void dcArgULong(DCCallVM* vm, unsigned long p)
{
    dcArgLong(vm, reinterpret_cast<long&>(p));
}

inline void dcArgULongLong(DCCallVM* vm, unsigned long long p)
{
    dcArgLong(vm, reinterpret_cast<long long&>(p));
}

#define dcArgSizeT dcArgULong

#define dcArgBool dcArgUInt8
}
