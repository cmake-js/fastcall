#pragma once
#include <nan.h>
#include <dyncall.h>
#include "helpers.h"
#include "defs.h"

namespace fastcall {
static v8::Local<v8::Value> workerArgs[2] = { Nan::Null(), Nan::Null() };

template <typename T>
struct CallAsyncWorker {
    typedef T (*TCallFunc)(DCCallVM*, DCpointer);
    typedef v8::Local<v8::Value>(*TConvertFunc)(T);

    CallAsyncWorker(
        Nan::Global<v8::Function>&& callback,
        DCCallVM* vm,
        DCpointer funcPtr,
        TCallFunc callFunc,
        TConvertFunc convertFunc)
        : callback(std::move(callback))
        , vm(vm)
        , funcPtr(funcPtr)
        , callFunc(callFunc)
        , convertFunc(convertFunc)
    {
        work.data = this;
    }

    ~CallAsyncWorker()
    {
        dcFree(vm);
    }

    void Start()
    {
        int r = uv_queue_work(uv_default_loop(), &work, Call, Finished);
        assert(!r);
    }

private:
    Nan::Global<v8::Function> callback;
    DCCallVM* vm;
    DCpointer funcPtr;
    TCallFunc callFunc;
    TConvertFunc convertFunc;
    T result;
    uv_work_t work;

    static void Call(uv_work_t* req)
    {
        auto self = (CallAsyncWorker<T>*)req->data;
        self->Execute();
    }

    static void Finished(uv_work_t* req, int status)
    {
        Nan::HandleScope scope;

        auto self = (CallAsyncWorker<T>*)req->data;
        self->HandleOKCallback();
        delete self;
    }

    void Execute()
    {
        result = callFunc(vm, funcPtr);
    }

    void HandleOKCallback()
    {
        workerArgs[1] = convertFunc(result);
        Nan::New(callback)->Call(Nan::Undefined(), 2, workerArgs);
    }
};

template <typename T>
inline CallAsyncWorker<T>* MakeCallAsyncWorker(
    Nan::Global<v8::Function>&& callback,
    DCCallVM* vm,
    DCpointer funcPtr,
    typename CallAsyncWorker<T>::TCallFunc callFunc,
    typename CallAsyncWorker<T>::TConvertFunc convertFunc)
{
    return new CallAsyncWorker<T>(
        std::move(callback),
        vm,
        funcPtr,
        callFunc,
        convertFunc);
}

template <typename T>
inline void CallAsync(
    const Nan::FunctionCallbackInfo<v8::Value>& info,
    typename CallAsyncWorker<T>::TCallFunc callFunc,
    typename CallAsyncWorker<T>::TConvertFunc convertFunc)
{
    auto worker = MakeCallAsyncWorker<T>(
        Nan::Global<v8::Function>(info[2].As<v8::Function>()),
        Unwrap<DCCallVM>(info[0]),
        UnwrapPointer(info[1]),
        callFunc,
        convertFunc);

    worker->Start();
}

NAN_MODULE_INIT(InitDyncallWrapper);
}
