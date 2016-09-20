#pragma once
#include <functional>
#include <nan.h>

namespace fastcall {
typedef std::function<v8::Local<v8::Object>(const v8::Local<v8::Function>&)> TCallbackFactory;

TCallbackFactory MakeCallbackFactory(const v8::Local<v8::Object>& cb);
}
