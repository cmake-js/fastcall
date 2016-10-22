#pragma once
#include <nan.h>
#include <dynload.h>
#include <memory>
#include "instance.h"

namespace fastcall {
struct Loop;

struct LibraryBase : public Nan::ObjectWrap, Instance {
    static NAN_MODULE_INIT(Init);
    
    static LibraryBase* FindLibraryBase(const v8::Local<v8::Object>& _lib);

private:
    static Nan::Persistent<v8::Function> constructor;

    DLLib* pLib = nullptr;

    static NAN_METHOD(New);

    static NAN_METHOD(initialize);
    static NAN_METHOD(free);

    static DLLib* FindPLib(const v8::Local<v8::Object>& _base);
};
}
