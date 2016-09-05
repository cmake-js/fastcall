#pragma once
#include <nan.h>

namespace fastcall {
int64_t GetInt64(const v8::Local<v8::Value>& value);
uint64_t GetUint64(const v8::Local<v8::Value>& value);
v8::Local<v8::Value> MakeInt64(int64_t value);
v8::Local<v8::Value> MakeUint64(uint64_t value);
}
