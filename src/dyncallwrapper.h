#pragma once
#include <nan.h>
#include <dyncall.h>
#include "helpers.h"

namespace fastcall {
static v8::Local<v8::Value> workerArgs[2] = { Nan::Null(), Nan::Null() };

template <typename T, typename TCallFunc, typename TConvertFunc>
struct CallAsyncWorker : Nan::AsyncWorker {

    CallAsyncWorker(
        Nan::Callback* callback,
        DCCallVM* vm,
        DCpointer funcPtr,
        TCallFunc&& callFunc,
        TConvertFunc&& convertFunc)
        : Nan::AsyncWorker(callback)
        , vm(vm)
        , funcPtr(funcPtr)
        , callFunc(std::forward<TCallFunc>(callFunc))
        , convertFunc(std::forward<TConvertFunc>(convertFunc))
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

template <typename T, typename TCallFunc, typename TConvertFunc>
inline CallAsyncWorker<T, TCallFunc, TConvertFunc>* MakeCallAsyncWorker(
    Nan::Callback* callback,
    DCCallVM* vm,
    DCpointer funcPtr,
    TCallFunc&& callFunc,
    TConvertFunc&& convertFunc)
{
    return new CallAsyncWorker<T, TCallFunc, TConvertFunc>(
        callback,
        vm,
        funcPtr,
        std::forward<TCallFunc>(callFunc),
        std::forward<TConvertFunc>(convertFunc));
}

template <typename T, typename TCallFunc, typename TConvertFunc>
inline void CallAsync(
    const Nan::FunctionCallbackInfo<v8::Value>& info,
    TCallFunc&& callFunc,
    TConvertFunc&& convertFunc)
{
    Nan::AsyncQueueWorker(
        MakeCallAsyncWorker<T>(
            new Nan::Callback(info[2].As<v8::Function>()),
            Unwrap<DCCallVM>(info[0]),
            UnwrapPointer(info[1]),
            std::forward<TCallFunc>(callFunc),
            std::forward<TConvertFunc>(convertFunc)));
    info.GetReturnValue().SetUndefined();
}

NAN_MODULE_INIT(InitDyncallWrapper);
}
