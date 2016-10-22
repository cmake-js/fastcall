#include "deps.h"
#include "dynloadwrapper.h"
#include "dyncallwrapper.h"
#include "statics.h"

using namespace v8;
using namespace fastcall;

NAN_MODULE_INIT(InitAll)
{
    InitStatics(target);
    InitDynloadWrapper(target);
    InitDyncallWrapper(target);
    InitStatics(target);
}

NODE_MODULE(fastcall, InitAll)
