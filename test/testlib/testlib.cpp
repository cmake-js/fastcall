#include <nan.h>

const char world[] = "world";
const double numbers[] = { 1.1, 2.2, 3.3 };

extern "C" {
int NODE_MODULE_EXPORT mul(int value, int by)
{
    return value * by;
}

long NODE_MODULE_EXPORT readLongPtr(long* ptr, unsigned offset)
{
    return ptr[offset];
}

void NODE_MODULE_EXPORT writeString(char* str)
{
    str[0] = 'h';
    str[1] = 'e';
    str[2] = 'l';
    str[3] = 'l';
    str[4] = 'o';
    str[5] = 0;
}

char* NODE_MODULE_EXPORT getString()
{
    return (char*)world;
}

void NODE_MODULE_EXPORT getNumbers(double** nums, size_t* size)
{
    *nums = (double*)numbers;
    *size = 3;
}
}
