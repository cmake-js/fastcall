#pragma once
#include <nan.h>

namespace fastcall {
const unsigned SYNC_CALL_MODE = 1;
const unsigned ASYNC_CALL_MODE = 2;

typedef Nan::Persistent<v8::Object, v8::CopyablePersistentTraits<v8::Object> > TCopyablePersistent;
}
