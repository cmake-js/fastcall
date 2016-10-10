#include "functions.h"
#include "deps.h"

using namespace std;

double fastcall::benchmarks::addNumbers(float floatValue, int intValue)
{
    return (double)floatValue + (double)intValue;
}

void fastcall::benchmarks::concat(const char* str1, const char* str2, char* result, unsigned resultSize)
{
    assert(str1);
    assert(str2);
    assert(result);
    assert(resultSize < 1000);

    string string1(str1);
    string string2(str2);
    string resultString = string1 + string2;
    memset(result, 0, resultSize);
    memcpy(result, resultString.c_str(), resultString.size());
}

int fastcall::benchmarks::makeInt(float floatValue, double doubleValue, fastcall::benchmarks::TMakeIntFunc func)
{
    return func(floatValue, doubleValue);
}
