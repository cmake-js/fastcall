#include "callbackfactories.h"
#include "deps.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

namespace {

}

TCallbackFactory fastcall::MakeCallbackFactory(const v8::Local<Object>& cb)
{
    // info[0] = function
    // result: ptr (ref)
    // - data: Buffer(CallbackData) -> custom GC delete handler
}
