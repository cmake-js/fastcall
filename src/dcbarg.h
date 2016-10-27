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
