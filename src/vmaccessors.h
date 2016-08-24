#pragma once
#include <nan.h>
#include <functional>
#include <dyncall.h>

namespace fastcall {
typedef std::function<v8::Local<v8::Value>(const Nan::FunctionCallbackInfo<v8::Value>&)> TInvoker;

TInvoker MakeInvoker(const v8::Local<v8::Object>& func);
}
