#include <nan.h>

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

}
