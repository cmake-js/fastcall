#pragma once
#include <nan.h>

namespace fastcall {
NAN_MODULE_INIT(InitStatics);
v8::Local<v8::Value> Require(const char* name);
v8::Local<v8::Object> RequireRef();
v8::Local<v8::Object> DerefType(v8::Local<v8::Object> refType);
v8::Local<v8::Object> MakeAsyncResult(const v8::Local<v8::Object>& func, const v8::Local<v8::Object>& type);
bool IsV8Thread();
}
