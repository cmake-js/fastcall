#pragma once
#include <functional>
#include <nan.h>

namespace fastcall {
struct Loop;
typedef std::vector<v8::Local<v8::Value> > TCallbackArgs;
typedef std::function<v8::Local<v8::Object>(const v8::Local<v8::Object>&, const v8::Local<v8::Function>&)> TCallbackFactory;

struct StaticCallbackData {
    StaticCallbackData();
    TCallbackArgs args;
    static StaticCallbackData instance;
};

TCallbackFactory MakeCallbackFactory(const v8::Local<v8::Object>& _base, Loop* loop);
}
