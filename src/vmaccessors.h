#pragma once
#include <nan.h>
#include <functional>
#include <dyncall.h>

namespace fastcall {
typedef std::function<void(DCCallVM*, const Nan::FunctionCallbackInfo<v8::Value>&)> TVMInitialzer;
typedef std::function<v8::Local<v8::Value>(const v8::Local<v8::Object>&, DCCallVM*)> TVMInvoker;

TVMInitialzer MakeVMInitializer(const v8::Local<v8::Object>& func);
TVMInvoker MakeSyncVMInvoker(const v8::Local<v8::Object>& func);
}
