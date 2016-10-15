#pragma once

namespace fastcall {
namespace benchmarks {
typedef int (*TMakeIntFunc)(float, double, void*);

double addNumbers(float floatValue, int intValue);
void concat(const char* str1, const char* str2, char* result, unsigned resultSize);
int makeInt(float floatValue, double doubleValue, TMakeIntFunc func, void* context);
}
}
