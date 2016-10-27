#ifdef WIN32
#define _WINSOCKAPI_
#include <windows.h>
#else
#include <pthread.h>
#endif
#include "statics.h"
#include "deps.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

namespace {
Nan::Persistent<v8::Object> savedTarget;

#ifdef WIN32
DWORD mainThreadId;
#else
uv_thread_t mainThreadHandle;
#endif
}

NAN_MODULE_INIT(fastcall::InitStatics)
{
    savedTarget.Reset(target);
#ifdef WIN32
    mainThreadId = GetCurrentThreadId();
#else
    mainThreadHandle = (uv_thread_t)uv_thread_self();
#endif
}

v8::Local<Value> fastcall::Require(const char* name)
{
    Nan::EscapableHandleScope scope;

    auto target = Nan::New(savedTarget);
    assert(!target.IsEmpty() && target->IsObject());
    auto require = GetValue<v8::Function>(target, "require");
    assert(!require.IsEmpty());
    v8::Local<v8::Value> args[] = { Nan::New<v8::String>(name).ToLocalChecked() };
    auto module = Nan::Call(require, GetGlobal(), 1, args).ToLocalChecked();
    assert(!module->IsUndefined() && !module->IsNull());
    return scope.Escape(module);
}

bool fastcall::IsV8Thread()
{
#ifdef WIN32
    return mainThreadId == GetCurrentThreadId();
#else
    auto currThread = (uv_thread_t)uv_thread_self();
    return pthread_equal(currThread, mainThreadHandle);
#endif
}
