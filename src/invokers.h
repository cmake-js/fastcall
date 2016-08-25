#pragma once
#include <nan.h>
#include <functional>
#include <dyncall.h>

namespace fastcall {
typedef std::function<v8::Local<v8::Value>(const Nan::FunctionCallbackInfo<v8::Value>&)> TInvoker;
typedef std::function<void(DCCallVM*)> TAsyncInvoker;

TInvoker MakeInvoker(const v8::Local<v8::Object>& func);
}
