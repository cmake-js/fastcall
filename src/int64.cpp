#include "int64.h"
#include "deps.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

#define JS_MAX_INT +9007199254740992LL
#define JS_MIN_INT -9007199254740992LL

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
