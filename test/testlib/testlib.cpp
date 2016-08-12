#include <nan.h>

extern "C" {
int NODE_MODULE_EXPORT mul(int value, int by)
{
    return value * by;
}
}
