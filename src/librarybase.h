#pragma once
#include <nan.h>

namespace fastcall {
struct LibraryBase : public node::ObjectWrap {
    LibraryBase(const LibraryBase&) = delete;
    LibraryBase(LibraryBase&&) = delete;
    ~LibraryBase();

    static NAN_MODULE_INIT(Init);

private:
    LibraryBase();

    static Nan::Persistent<v8::Function> constructor;

    static NAN_METHOD(New);
};
}
