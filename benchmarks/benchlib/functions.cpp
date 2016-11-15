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

int fastcall::benchmarks::makeInt(float floatValue, double doubleValue, fastcall::benchmarks::TMakeIntFunc func, void* context)
{
    return func(floatValue, doubleValue, context);
}
