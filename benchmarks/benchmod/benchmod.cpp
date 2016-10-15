#include "deps.h"
#include "functions.h"
#include "worker.h"
#include <future>

using namespace std;
using namespace v8;
using namespace fastcall::benchmarks;

#define FASTCALL_BENCHMARKS_VERIFY_LEN(len) \
    if (info.Length() < len)                \
    return Nan::ThrowError("Invalid number of arguments.")

NAN_METHOD(AddNumbers)
{
    FASTCALL_BENCHMARKS_VERIFY_LEN(2);

    auto result = addNumbers(info[0]->NumberValue(), info[1]->Int32Value());

    return info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(AddNumbersAsync)
{
    FASTCALL_BENCHMARKS_VERIFY_LEN(3);

    float floatValue = info[0]->NumberValue();
    int intValue = info[1]->Int32Value();

    auto worker = new Worker<double>(
        new Nan::Callback(info[2].As<Function>()),
        [=]() {
            return addNumbers(floatValue, intValue);
        },
        [=](Worker<double>* worker, double result) {
            return Nan::New(result);
        });

    Nan::AsyncQueueWorker(worker);

    return info.GetReturnValue().SetUndefined();
}

NAN_METHOD(Concat)
{
    FASTCALL_BENCHMARKS_VERIFY_LEN(2);

    string str1(*Nan::Utf8String(info[0]));
    string str2(*Nan::Utf8String(info[1]));

    char* result = (char*)malloc(100);
    concat(str1.c_str(), str2.c_str(), result, 100);
    auto str = Nan::New<String>(result).ToLocalChecked();
    free(result);

    return info.GetReturnValue().Set(str);
}

NAN_METHOD(ConcatAsync)
{
    FASTCALL_BENCHMARKS_VERIFY_LEN(3);

    string str1(*Nan::Utf8String(info[0]));
    string str2(*Nan::Utf8String(info[1]));

    auto worker = new Worker<string>(
        new Nan::Callback(info[2].As<Function>()),
        [=]() {
            char* result = (char*)malloc(100);
            concat(str1.c_str(), str2.c_str(), result, 100);
            return string(result);
        },
        [=](Worker<string>* worker, const string& result) {
            return Nan::New<String>(result.c_str()).ToLocalChecked();
        });

    Nan::AsyncQueueWorker(worker);

    return info.GetReturnValue().SetUndefined();
}

NAN_METHOD(MakeInt)
{
    FASTCALL_BENCHMARKS_VERIFY_LEN(3);

    auto nativeCallback = [](float fv, double dv, void* ctx) {
        Nan::HandleScope scope;

        auto nanCb = (Nan::Callback*)ctx;
        Local<Value> args[] = { Nan::New(fv), Nan::New(dv) };
        auto result = nanCb->Call(2, &args[0]);

        return result->Int32Value();
    };

    auto jsCallback = new Nan::Callback(info[2].As<Function>());
    int result = makeInt(info[0]->NumberValue(), info[1]->NumberValue(), nativeCallback, jsCallback);
    return info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(MakeIntAsync)
{
    FASTCALL_BENCHMARKS_VERIFY_LEN(4);

    float fv = info[0]->NumberValue();
    double dv = info[1]->NumberValue();
    auto jsCallback = new Nan::Callback(info[2].As<Function>());

    struct Data {
        Data(Nan::Callback* callback)
            : callback(callback)
        {
        }
        std::promise<int> resultPromise;
        Nan::Callback* callback;
        float fv;
        double dv;
    };

    auto work = [](uv_async_t* handle) {
        Nan::HandleScope scope;

        auto data = ((Data*)handle->data);
        Local<Value> args[] = { Nan::New(data->fv), Nan::New(data->dv) };
        auto result = data->callback->Call(2, &args[0]);

        data->resultPromise.set_value(result->Int32Value());
    };

    auto nativeCallback = [](float fv, double dv, void* ctx) {
        auto handle = (uv_async_t*)ctx;
        auto data = ((Data*)handle->data);
        data->fv = fv;
        data->dv = dv;
        uv_async_send(handle);
        return data->resultPromise.get_future().get();
    };

    uv_async_t* asyncHandle = new uv_async_t;
    auto data = new Data(jsCallback);;
    asyncHandle->data = data;
    uv_async_init(uv_default_loop(), asyncHandle, work);

    auto worker = new Worker<int>(
        new Nan::Callback(info[3].As<Function>()),
        [=]() {
            return makeInt(fv, dv, nativeCallback, (void*)asyncHandle);
        },
        [=](Worker<int>* worker, int result) {
            delete data;
            uv_close((uv_handle_t*)asyncHandle, [](uv_handle_t* handle) { delete (uv_async_t*)handle; });
            return Nan::New(result);
        });

    Nan::AsyncQueueWorker(worker);

    return info.GetReturnValue().SetUndefined();
}

NAN_MODULE_INIT(Init)
{
    Nan::Set(target, Nan::New<String>("addNumbers").ToLocalChecked(), Nan::New<FunctionTemplate>(AddNumbers)->GetFunction());
    Nan::Set(target, Nan::New<String>("concat").ToLocalChecked(), Nan::New<FunctionTemplate>(Concat)->GetFunction());
    Nan::Set(target, Nan::New<String>("makeInt").ToLocalChecked(), Nan::New<FunctionTemplate>(MakeInt)->GetFunction());
    Nan::Set(target, Nan::New<String>("addNumbersAsync").ToLocalChecked(), Nan::New<FunctionTemplate>(AddNumbersAsync)->GetFunction());
    Nan::Set(target, Nan::New<String>("concatAsync").ToLocalChecked(), Nan::New<FunctionTemplate>(ConcatAsync)->GetFunction());
    Nan::Set(target, Nan::New<String>("makeIntAsync").ToLocalChecked(), Nan::New<FunctionTemplate>(MakeIntAsync)->GetFunction());
}

NODE_MODULE(benchmod, Init)
