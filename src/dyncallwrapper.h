#pragma once
#include <nan.h>
#include <dyncall.h>
#include "helpers.h"

namespace fastcall {
static v8::Local<v8::Value> workerArgs[2] = { Nan::Null(), Nan::Null() };

template <typename T>
struct CallAsyncWorker : Nan::AsyncWorker {
    typedef T (*TCallFunc)(DCCallVM*, DCpointer);
    typedef v8::Local<v8::Value>(*TConvertFunc)(T);

    CallAsyncWorker(
        Nan::Callback* callback,
        DCCallVM* vm,
        DCpointer funcPtr,
        TCallFunc callFunc,
        TConvertFunc convertFunc)
        : Nan::AsyncWorker(callback)
        , vm(vm)
        , funcPtr(funcPtr)
        , callFunc(callFunc)
        , convertFunc(convertFunc)
    {
    }

private:
    DCCallVM* vm;
    DCpointer funcPtr;
    TCallFunc callFunc;
    TConvertFunc convertFunc;
    T result;

    void Execute() override
    {
        result = callFunc(vm, funcPtr);
    }

    void HandleOKCallback() override
    {
        workerArgs[1] = convertFunc(result);
        callback->Call(2, workerArgs);
    }

    void Destroy() override
    {
        dcFree(vm);
    }
};

template <typename T>
inline CallAsyncWorker<T>* MakeCallAsyncWorker(
    Nan::Callback* callback,
    DCCallVM* vm,
    DCpointer funcPtr,
    typename CallAsyncWorker<T>::TCallFunc callFunc,
    typename CallAsyncWorker<T>::TConvertFunc convertFunc)
{
    return new CallAsyncWorker<T>(
        callback,
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
    Nan::AsyncQueueWorker(
        MakeCallAsyncWorker<T>(
            new Nan::Callback(info[2].As<v8::Function>()),
            Unwrap<DCCallVM>(info[0]),
            UnwrapPointer(info[1]),
            callFunc,
            convertFunc));
}

NAN_MODULE_INIT(InitDyncallWrapper);
}
