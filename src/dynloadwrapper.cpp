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

#include "deps.h"
#include "dynloadwrapper.h"
#include "helpers.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace fastcall;

namespace {

NAN_METHOD(loadLibrary)
{
    char* str = *Nan::Utf8String(info[0]);
    DLLib* pLib = dlLoadLibrary(str);
    if (!pLib) {
        return Nan::ThrowTypeError((string("Cannot load library or library not found: ") + str).c_str());
    }
    return info.GetReturnValue().Set(WrapPointer(pLib));
}

NAN_METHOD(freeLibrary)
{
    DLLib* pLib = UnwrapPointer<DLLib>(info[0]);
    if (!pLib) {
        return Nan::ThrowTypeError("Argument value is null or not a pointer.");
    }
    dlFreeLibrary(pLib);
    return info.GetReturnValue().SetUndefined();
}

NAN_METHOD(findSymbol)
{
    DLLib* pLib = UnwrapPointer<DLLib>(info[0]);
    if (!pLib) {
        return Nan::ThrowTypeError("First argument's value is null or not a pointer.");
    }
    char* str = *Nan::Utf8String(info[1]);
    void* pF = dlFindSymbol(pLib, str);
    if (!pF) {
        return info.GetReturnValue().Set(Nan::Null());
    }
    return info.GetReturnValue().Set(WrapPointer(pF));
}
}

NAN_MODULE_INIT(fastcall::InitDynloadWrapper)
{
    auto dynload = Nan::New<Object>();
    Nan::Set(target, Nan::New<String>("dynload").ToLocalChecked(), dynload);
    Nan::Set(dynload, Nan::New<String>("loadLibrary").ToLocalChecked(), Nan::New<FunctionTemplate>(loadLibrary)->GetFunction());
    Nan::Set(dynload, Nan::New<String>("freeLibrary").ToLocalChecked(), Nan::New<FunctionTemplate>(freeLibrary)->GetFunction());
    Nan::Set(dynload, Nan::New<String>("findSymbol").ToLocalChecked(), Nan::New<FunctionTemplate>(findSymbol)->GetFunction());
}
