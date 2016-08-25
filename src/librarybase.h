#pragma once
#include <nan.h>
#include <dynload.h>
#include <memory>
#include "locker.h"

namespace fastcall {
struct Loop;

struct LibraryBase : public node::ObjectWrap {
    LibraryBase(const LibraryBase&) = delete;
    LibraryBase(LibraryBase&&) = delete;
    ~LibraryBase();

    static NAN_MODULE_INIT(Init);
    
    Lock AcquireLock();
    void EnsureAsyncSupport();
    Loop* GetLoop();

private:
    LibraryBase();

    static Nan::Persistent<v8::Function> constructor;

    DLLib* pLib = nullptr;
    Locker locker;
    std::unique_ptr<Loop> loop;

    static NAN_METHOD(New);

    static NAN_METHOD(initialize);
    static NAN_METHOD(free);

    static DLLib* FindPLib(const v8::Local<v8::Object>& self);
};

inline Loop* LibraryBase::GetLoop()
{
    return loop.get();
}
}
