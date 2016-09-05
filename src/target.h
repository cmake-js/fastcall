#pragma once
#include <nan.h>

namespace fastcall {
NAN_MODULE_INIT(InitTarget);
v8::Local<v8::Value> Require(const char* name);
v8::Local<v8::Object> RequireRef();
v8::Local<v8::Value> MakeNumber(const v8::Local<v8::Value>& value);
v8::Local<v8::Value> MakeInt64(int64_t value);
v8::Local<v8::Value> MakeUint64(uint64_t value);
}
