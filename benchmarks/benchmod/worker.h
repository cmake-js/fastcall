/*
Copyright 2016 Gábor Mező (gabor.mezo@outlook.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

#pragma once

#include <functional>
#include <nan.h>
#include <exception>

namespace fastcall {
namespace benchmarks {
inline NAN_METHOD(Noop)
{

    info.GetReturnValue().SetUndefined();
}

template<typename T>
struct Worker : public Nan::AsyncWorker
{
    typedef std::function<T()> ExecuteFunc;
    typedef std::function<v8::Local<v8::Value>(Worker<T>*, T)> ResultConvFunc;

    Worker(Nan::Callback *callback, const ExecuteFunc& executeFunc, const ResultConvFunc& resultConvFunc) :
        Nan::AsyncWorker(callback ? callback : new Nan::Callback(Nan::New<v8::FunctionTemplate>(Noop)->GetFunction())),
        executeFunc(executeFunc),
        resultConvFunc(std::move(ConvResult(resultConvFunc)))
    {
    }

    Worker(Nan::Callback *callback, const ExecuteFunc& executeFunc) :
        Nan::AsyncWorker(callback ? callback : new Nan::Callback(Nan::New<v8::FunctionTemplate>(Noop)->GetFunction())),
        executeFunc(executeFunc),
        resultConvFunc(std::move(ConvResult([](Worker<T>* w, T v) { return Nan::New(v); })))
    {
    }

    Worker(Nan::Callback *callback, ExecuteFunc&& executeFunc, const ResultConvFunc& resultConvFunc) :
        Nan::AsyncWorker(callback ? callback : new Nan::Callback(Nan::New<v8::FunctionTemplate>(Noop)->GetFunction())),
        executeFunc(std::move(executeFunc)),
        resultConvFunc(std::move(ConvResult(resultConvFunc)))
    {
    }

    Worker(Nan::Callback *callback, ExecuteFunc&& executeFunc) :
        Nan::AsyncWorker(callback ? callback : new Nan::Callback(Nan::New<v8::FunctionTemplate>(Noop)->GetFunction())),
        executeFunc(std::move(executeFunc)),
        resultConvFunc(std::move(ConvResult([](Worker<T>* w, T v) { return Nan::New(v); })))
    {
    }

    void Execute() override
    {
        using namespace std;
        try
        {
            result = executeFunc();
        }
        catch(std::exception& ex)
        {
            SetErrorMessage(ex.what());
        }
        catch(...)
        {
            SetErrorMessage("Unknown error!");
        }
    }

protected:
    void HandleOKCallback() override
    {
        using namespace v8;

        auto convertedResult = resultConvFunc(this, result);
        if (convertedResult->IsNativeError())
        {
            Local<Value> info[] = { convertedResult };
            callback->Call(1, info);
        }
        else
        {
            Local<Value> info[] = { Nan::Null(), convertedResult };
            callback->Call(2, info);
        }
    }

private:
    ExecuteFunc executeFunc;
    ResultConvFunc resultConvFunc;
    T result;

    ResultConvFunc ConvResult(const ResultConvFunc& resultConvFunc)
    {
        return std::move([=](Worker<T>* i, T result)
        {
            Nan::EscapableHandleScope scope;
            try
            {
                return scope.Escape(resultConvFunc(i, result));
            }
            catch(std::exception& ex)
            {
                return scope.Escape(Nan::Error(ex.what()));
            }
            catch(...)
            {
                return scope.Escape(Nan::Error("Unknown error!"));
            }
        });
    }
};

template<>
struct Worker<void> : public Nan::AsyncWorker
{
    typedef std::function<void()> ExecuteFunc;

    Worker(Nan::Callback *callback, const ExecuteFunc& executeFunc) :
        Nan::AsyncWorker(callback ? callback : new Nan::Callback(Nan::New<v8::FunctionTemplate>(Noop)->GetFunction())),
        executeFunc(executeFunc)
    {
    }

    Worker(Nan::Callback *callback, ExecuteFunc&& executeFunc) :
        Nan::AsyncWorker(callback ? callback : new Nan::Callback(Nan::New<v8::FunctionTemplate>(Noop)->GetFunction())),
        executeFunc(std::move(executeFunc))
    {
    }

    void Execute() override
    {
        using namespace std;
        try
        {
            executeFunc();
        }
        catch(exception& ex)
        {
            SetErrorMessage(ex.what());
        }
        catch(...)
        {
            SetErrorMessage("Unknown error!");
        }
    }

private:
    ExecuteFunc executeFunc;
};
}
}
