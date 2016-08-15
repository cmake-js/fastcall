#pragma once
#include <nan.h>
#include <functional>
#include <dyncall.h>

namespace fastcall {
typedef std::function<void(DCCallVM*, const Nan::FunctionCallbackInfo<v8::Value>&)> TVMInitialzer;

TVMInitialzer MakeVMInitializer(const v8::Local<v8::Object>& self);
}
