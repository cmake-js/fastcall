#include <nan.h>

const char world[] = "world";
const double numbers[] = { 1.1, 2.2, 3.3 };
typedef int TMakeIntFunc(float, double);

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
}
