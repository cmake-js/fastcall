#pragma once
#include <nan.h>
#include <functional>
#include <dyncall.h>
#include <dyncall_callback.h>
#include <vector>
#include <memory>

namespace fastcall {
typedef std::function<void()> TReleaseFunction;
typedef std::function<v8::Local<v8::Value>(const Nan::FunctionCallbackInfo<v8::Value>&)> TFunctionInvoker;
typedef std::function<void(DCCallVM*)> TAsyncFunctionInvoker;
typedef std::vector<TReleaseFunction> TReleaseFunctions;

TFunctionInvoker MakeFunctionInvoker(const v8::Local<v8::Object>& _base);
}
