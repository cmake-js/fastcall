#pragma once
#include <functional>
#include <nan.h>

namespace fastcall {
typedef std::function<v8::Local<v8::Object>(const Nan::FunctionCallbackInfo<v8::Value>&)> TCallbackFactory;

TCallbackFactory MakeCallbackFactory(const v8::Local<v8::Object>& cb);
}
