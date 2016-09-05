#pragma once
#include <nan.h>

namespace fastcall {
NAN_MODULE_INIT(InitTarget);
v8::Local<v8::Value> Require(const char* name);
v8::Local<v8::Object> RequireRef();
}
