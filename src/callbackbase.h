#pragma once
#include <nan.h>
#include <dyncall_callback.h>
#include "instance.h"

namespace fastcall {
struct LibraryBase;

struct CallbackBase : public Nan::ObjectWrap, Instance {
    static NAN_MODULE_INIT(Init);

    static bool IsCallbackBase(const v8::Local<v8::Object>& self);
    static CallbackBase* AsCallbackBase(const v8::Local<v8::Object>& self);
    static CallbackBase* GetCallbackBase(const v8::Local<v8::Object>& self);
    LibraryBase* GetLibrary();
    DCCallback* MakeCallback(const v8::Local<v8::Object>& self);

private:
    static Nan::Persistent<v8::Function> constructor;

    bool initialized = false;
    LibraryBase* library = nullptr;

    static NAN_METHOD(New);

    static NAN_METHOD(initialize);
    static NAN_METHOD(makeCallback);

    static v8::Local<v8::Object> FindLibrary(const v8::Local<v8::Object>& self);
    static LibraryBase* FindLibraryBase(const v8::Local<v8::Object>& self);
};

inline LibraryBase* CallbackBase::GetLibrary()
{
    assert(library);
    return library;
}
}
