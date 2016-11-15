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

#include "mutex.h"
#include "deps.h"
#include "helpers.h"
#include <mutex>

using namespace std;
using namespace v8;
using namespace node;
using namespace fastcall;

namespace {
NAN_METHOD(newMutex)
{
    info.GetReturnValue().Set(Wrap<mutex>(new mutex()));
    Nan::AdjustExternalMemory(sizeof(mutex));
}

NAN_METHOD(lock)
{
    auto m = Unwrap<mutex>(info[0]);
    m->lock();
}

NAN_METHOD(unlock)
{
    auto m = Unwrap<mutex>(info[0]);
    m->unlock();
}
}

NAN_MODULE_INIT(fastcall::InitMutex)
{
    auto _mutex = Nan::New<Object>();
    Nan::Set(target, Nan::New<String>("mutex").ToLocalChecked(), _mutex);
    Nan::Set(_mutex, Nan::New<String>("newMutex").ToLocalChecked(), Nan::New<FunctionTemplate>(newMutex)->GetFunction());
    Nan::Set(_mutex, Nan::New<String>("lock").ToLocalChecked(), Nan::New<FunctionTemplate>(lock)->GetFunction());
    Nan::Set(_mutex, Nan::New<String>("unlock").ToLocalChecked(), Nan::New<FunctionTemplate>(unlock)->GetFunction());
}
