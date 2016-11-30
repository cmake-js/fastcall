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
#include <dyncall_callback.h>
#include "int64.h"

namespace fastcall {
#define dcbArgInt8 dcbArgChar

inline unsigned char dcbArgUInt8(DCArgs* args)
{
    char tmp = dcbArgChar(args);
    return reinterpret_cast<unsigned char&>(tmp);
}

inline bool dcbArgBoolean(DCArgs* args)
{
    char tmp = dcbArgChar(args);
    return (bool)tmp;
}

#define dcCallInt8 dcCallChar

#define dcbArgInt16 dcbArgShort

inline unsigned short dcbArgUInt16(DCArgs* args)
{
    short tmp = dcbArgShort(args);
    return reinterpret_cast<unsigned short&>(tmp);
}

#define dcCallInt16 dcCallShort

#define dcbArgInt32 dcbArgInt

inline unsigned int dcbArgUInt32(DCArgs* args)
{
    int tmp = dcbArgInt(args);
    return reinterpret_cast<unsigned int&>(tmp);
}

#define dcCallInt32 dcCallInt

#define dcbArgInt64 dcbArgLongLong

inline unsigned long long dcbArgUInt64(DCArgs* args)
{
    long long tmp = dcbArgLongLong(args);
    return reinterpret_cast<unsigned long long&>(tmp);
}

#define dcCallInt64 dcCallLongLong

#define dcbArgByte dcbArgUInt8

#define dcbArgSizeT dcbArgULong

#define dcbArgBool dcbArgUInt8
}
