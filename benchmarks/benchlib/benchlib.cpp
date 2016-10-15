#include "deps.h"
#include "functions.h"
#include <chrono>
#include <future>

using namespace std;
using namespace std::chrono;
using namespace fastcall::benchmarks;

double measureTime(std::function<void()> code, unsigned iterations)
{
    auto now = high_resolution_clock::now;
    auto t = now();
    for (unsigned i = 0; i < iterations; i++) {
        code();
    }
    duration<double> ellapsed = now() - t;
    return ellapsed.count() * 1000.0;
}

void runNativeNumberSyncTest()
{
    double result = addNumbers(addNumbers(5.5, 5), addNumbers(1.1, 1));
    assert(result == 5.5 + 5 + 1 + 1);
}

void runNativeStringSyncTest()
{
    char* result = (char*)malloc(100);
    string str1("Hello, ");
    string str2("World!");
    concat(str1.c_str(), str2.c_str(), result, 100);
    string resultString(result);
    free(result);
    assert(resultString == "Hello, World!");
}

void runNativeCallbackSyncTest()
{
    auto f = [](float floatValue, double doubleValue, void* context) {
        return (int)floatValue + (int)doubleValue;
    };
    int result = makeInt(makeInt(5.5, 5.1, f, nullptr), makeInt(1.1, 1.8, f, nullptr), f, nullptr);
    assert(result == 5 + 5 + 1 + 1);
}

void runNativeNumberAsyncTest()
{
    std::async(
        std::launch::async,
        [=]() {
            runNativeNumberSyncTest();
        })
        .wait();
}

void runNativeStringAsyncTest()
{
    std::async(
        std::launch::async,
        [=]() {
            runNativeStringSyncTest();
        })
        .wait();
}

void runNativeCallbackAsyncTest()
{
    std::async(
        std::launch::async,
        [=]() {
            runNativeNumberSyncTest();
        })
        .wait();
}

extern "C" {
NODE_MODULE_EXPORT double measureNativeNumberSyncTest(unsigned iterations)
{
    return measureTime(runNativeNumberSyncTest, iterations);
}

NODE_MODULE_EXPORT double measureNativeStringSyncTest(unsigned iterations)
{
    return measureTime(runNativeStringSyncTest, iterations);
}

NODE_MODULE_EXPORT double measureNativeCallbackSyncTest(unsigned iterations)
{
    return measureTime(runNativeCallbackSyncTest, iterations);
}

NODE_MODULE_EXPORT double measureNativeNumberAsyncTest(unsigned iterations)
{
    return measureTime(runNativeNumberAsyncTest, iterations);
}

NODE_MODULE_EXPORT double measureNativeStringAsyncTest(unsigned iterations)
{
    return measureTime(runNativeStringAsyncTest, iterations);
}

NODE_MODULE_EXPORT double measureNativeCallbackAsyncTest(unsigned iterations)
{
    return measureTime(runNativeCallbackAsyncTest, iterations);
}

NODE_MODULE_EXPORT double addNumbersExp(float floatValue, int intValue)
{
    return addNumbers(floatValue, intValue);
}

NODE_MODULE_EXPORT void concatExp(const char* str1, const char* str2, char* result, unsigned resultSize)
{
    return concat(str1, str2, result, resultSize);
}

NODE_MODULE_EXPORT int makeIntExp(float floatValue, double doubleValue, TMakeIntFunc func, void* context)
{
    return makeInt(floatValue, doubleValue, func, context);
}
}
