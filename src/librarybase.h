#pragma once
#include <nan.h>
#include <dynload.h>

namespace fastcall {
struct LibraryBase : public node::ObjectWrap {
    LibraryBase(const LibraryBase&) = delete;
    LibraryBase(LibraryBase&&) = delete;
    ~LibraryBase();

    static NAN_MODULE_INIT(Init);

private:
    LibraryBase();

    static Nan::Persistent<v8::Function> constructor;

    DLLib* pLib = nullptr;

    static NAN_METHOD(New);

    static NAN_METHOD(initialize);
    static NAN_METHOD(free);

    static DLLib* FindPLib(const v8::Local<v8::Object>& self);
};
}
