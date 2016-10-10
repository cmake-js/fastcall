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
    return ellapsed.count();
}

void runNativeNumberSyncTest()
{
    double result = addNumbers(addNumbers(5.5, 5), addNumbers(1.1, 1));
    assert(result == 5.5 + 5 + 1.1 + 1);
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
    auto f = [](float floatValue, double doubleValue) {
        return (int)floatValue + (int)doubleValue;
    };
    int result = makeInt(makeInt(5.5, 5.1, f), makeInt(1.1, 1.8, f), f);
    assert(result == 5 + 5 + 1 + 1);
}

void runNativeNumberAsyncTest()
{
    double result = std::async(std::launch::async, addNumbers,
                        std::async(std::launch::async, addNumbers, 5.5, 5).get(),
                        std::async(std::launch::async, addNumbers, 1.1, 1).get())
                        .get();
    assert(result == 5.5 + 5 + 1.1 + 1);
}

void runNativeStringAsyncTest()
{
    char* result = (char*)malloc(100);
    string str1("Hello, ");
    string str2("World!");
    std::async(std::launch::async, concat, str1.c_str(), str2.c_str(), result, 100).get();
    string resultString(result);
    free(result);
    assert(resultString == "Hello, World!");
}

void runNativeCallbackAsyncTest()
{
    auto f = [](float floatValue, double doubleValue) {
        return (int)floatValue + (int)doubleValue;
    };
    int result = std::async(std::launch::async, makeInt,
                     std::async(std::launch::async, makeInt, 5.5, 5.1, f).get(),
                     std::async(std::launch::async, makeInt, 1.1, 1.8, f).get(),
                     f)
                     .get();
    assert(result == 5 + 5 + 1 + 1);
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
}
