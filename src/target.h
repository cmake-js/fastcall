#pragma once
#include <nan.h>

namespace fastcall {
NAN_MODULE_INIT(InitTarget);
v8::Local<v8::Value> Require(const char* name);
v8::Local<v8::Object> RequireRef();
v8::Local<v8::Object> DerefType(v8::Local<v8::Object> refType);
v8::Local<v8::Object> MakeAsyncResult(const v8::Local<v8::Object>& func, const v8::Local<v8::Object>& type);
}
