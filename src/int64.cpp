/*
Copyright 2016 Gábor Mező (gabor.mezo@outlook.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

#include "int64.h"
#include "deps.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

const long long JS_MAX_INT = +9007199254740992LL;
const long long JS_MIN_INT = -9007199254740992LL;

int64_t fastcall::GetInt64(const v8::Local<Value>& value)
{
    Nan::HandleScope scope;

    if (value->IsString()) {
        return std::strtoll(*String::Utf8Value(value), nullptr, 0);
    }
    return static_cast<int64_t>(value->NumberValue());
}

uint64_t fastcall::GetUint64(const v8::Local<Value>& value)
{
    Nan::HandleScope scope;

    if (value->IsString()) {
        return std::strtoull(*String::Utf8Value(value), nullptr, 0);
    }
    return static_cast<uint64_t>(value->NumberValue());
}

v8::Local<Value> fastcall::MakeInt64(int64_t value)
{
    Nan::EscapableHandleScope scope;

    Local<Value> result;
    if (value < JS_MIN_INT || value > JS_MAX_INT) {
        char strbuf[128];
        snprintf(strbuf, 128, "%lld", (long long)value);
        result = Nan::New<String>(strbuf).ToLocalChecked();
    } else {
        result = Nan::New(static_cast<double>(value));
    }
    return scope.Escape(result);
}

v8::Local<Value> fastcall::MakeUint64(uint64_t value)
{
    Nan::EscapableHandleScope scope;

    Local<Value> result;
    if (value < JS_MIN_INT || value > JS_MAX_INT) {
        char strbuf[128];
        snprintf(strbuf, 128, "%llu", (long long)value);
        result = Nan::New<String>(strbuf).ToLocalChecked();
    } else {
        result = Nan::New(static_cast<double>(value));
    }
    return scope.Escape(result);
}
