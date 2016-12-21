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

#include "deps.h"

using namespace std;

const char world[] = "world";
const double numbers[] = { 1.1, 2.2, 3.3 };
typedef int (*TMakeIntFunc)(float, double);

struct TNumbers
{
    short a;
    int64_t b;
    long c;
};

union TUnion
{
    short a;
    int64_t b;
    long c;
};

struct TTaggedUnion
{
    char tag;
    TUnion data;
};

struct TRecWithArray
{
    long values[5];
    unsigned index;
};

struct ImageFormat
{
    unsigned imageChannelOrder;
    unsigned imageChannelDataType;
};

extern "C" {
NODE_MODULE_EXPORT int mul(int value, int by)
{
    return value * by;
}

NODE_MODULE_EXPORT long readLongPtr(long* ptr, unsigned offset)
{
    return ptr[offset];
}

NODE_MODULE_EXPORT void writeString(char* str)
{
    if (str == nullptr) {
        return;
    }
    str[0] = 'h';
    str[1] = 'e';
    str[2] = 'l';
    str[3] = 'l';
    str[4] = 'o';
    str[5] = 0;
}

NODE_MODULE_EXPORT char* getString()
{
    return (char*)world;
}

NODE_MODULE_EXPORT void getNumbers(double** nums, size_t* size)
{
    *nums = (double*)numbers;
    *size = 3;
}

NODE_MODULE_EXPORT int makeInt(float fv, double dv, TMakeIntFunc func)
{
    return func(fv, dv) * 2;
}

NODE_MODULE_EXPORT double addNumbers(float floatValue, int intValue)
{
    return (double)floatValue + (double)intValue;
}

NODE_MODULE_EXPORT int64_t mulStructMembers(TNumbers* numbers)
{
    if (!numbers) {
        return 0;
    }
    return numbers->a * numbers->b * numbers->c;
}

NODE_MODULE_EXPORT int64_t getAFromUnion(TUnion* u)
{
    if (!u) {
        return 0;
    }
    return u->a;
}

NODE_MODULE_EXPORT int64_t getBFromUnion(TUnion* u)
{
    if (!u) {
        return 0;
    }
    return u->b;
}

NODE_MODULE_EXPORT int64_t getCFromUnion(TUnion* u)
{
    if (!u) {
        return 0;
    }
    return u->c;
}

NODE_MODULE_EXPORT int64_t getValueFromTaggedUnion(TTaggedUnion* u)
{
    if (!u) {
        return 0;
    }
    if (u->tag == 'a') {
        return u->data.a;
    }
    if (u->tag == 'b') {
        return u->data.b;
    }
    return u->data.c;
}

NODE_MODULE_EXPORT void makeRecWithArrays(TRecWithArray** records, long* size)
{
    *size = 5;
    *records = new TRecWithArray[*size];
    for (unsigned i = 0; i < *size; ++i) {
        for (unsigned j = 0; j < 5; j++) {
            (*records)[i].values[j] = j;
        }
        (*records)[i].index = i;
    }
}

NODE_MODULE_EXPORT void incRecWithArrays(TRecWithArray records[], long size)
{
    for (unsigned i = 0; i < size; ++i) {
        for (unsigned j = 0; j < 5; j++) {
            records[i].values[j]++;
        }
        records[i].index++;
    }
}

NODE_MODULE_EXPORT void freeRecWithArrays(TRecWithArray records[])
{
    delete[] records;
}

NODE_MODULE_EXPORT void appendChar(char* str, unsigned pos, char charCode)
{
    str[pos] = charCode;
}

NODE_MODULE_EXPORT bool isArrayNull(int* arr)
{
    return arr == nullptr;
}

NODE_MODULE_EXPORT short uint64ToShort(uint64_t val)
{
    return (short)val;
}

NODE_MODULE_EXPORT int clGetSupportedImageFormats(void* context, uint64_t flags, unsigned type, unsigned size, ImageFormat formats[], unsigned* outSize)
{
    if (outSize) {
        *outSize = flags;
    }
    return type + size;
}

NODE_MODULE_EXPORT char readChar(char* str, unsigned pos)
{
    return str[pos];
}

NODE_MODULE_EXPORT void concatStrings(char* strings[], unsigned length, char* output)
{
    string out;
    for (unsigned i = 0; i < length; i++) {
        out += strings[i];
    }
    memcpy(output, out.c_str(), out.length());
}

}
