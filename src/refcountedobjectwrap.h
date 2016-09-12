#pragma once
#include <nan.h>
#include <cassert>

namespace fastcall {
struct RefCountedObjecWrap {
    RefCountedObjecWrap();
    RefCountedObjecWrap(const RefCountedObjecWrap&) = delete;
    RefCountedObjecWrap(RefCountedObjecWrap&&) = delete;

    virtual ~RefCountedObjecWrap();

    void AddRef(const v8::Local<v8::Object>& self);
    void Release();
private:
    int refCount = 0;
    Nan::Persistent<v8::Object> ref;
};

inline RefCountedObjecWrap::RefCountedObjecWrap() {}

inline RefCountedObjecWrap::~RefCountedObjecWrap()
{
    assert(!refCount);
}
}
