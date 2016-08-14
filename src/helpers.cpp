#include "deps.h"
#include "helpers.h"

using namespace std;
using namespace v8;
using namespace fastcall;
using namespace node;

v8::Local<v8::Value> fastcall::WrapPointer(char* ptr, size_t length)
{
    Nan::EscapableHandleScope scope;
    if (ptr == nullptr) length = 0;
    return scope.Escape(Nan::NewBuffer(ptr, length, Noop, nullptr).ToLocalChecked());
}

v8::Local<v8::Value> fastcall::WrapNullPointer()
{
    return WrapPointer((char*)nullptr, (size_t)0);
}

char* fastcall::UnwrapPointer(const v8::Local<Value>& value)
{
    Nan::HandleScope scope;
    if (value->IsObject() && Buffer::HasInstance(value)) {
        return Buffer::Data(value);
    }
    return nullptr;
}
