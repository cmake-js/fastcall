#include "deps.h"
#include "dynloadwrapper.h"
#include "statics.h"

using namespace v8;
using namespace fastcall;

NAN_MODULE_INIT(InitAll)
{
    InitStatics(target);
    InitDynloadWrapper(target);
}

NODE_MODULE(fastcall, InitAll)
