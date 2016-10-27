#pragma once
#include <nan.h>

namespace fastcall {
NAN_MODULE_INIT(InitStatics);

v8::Local<v8::Value> Require(const char* name);

bool IsV8Thread();
}
