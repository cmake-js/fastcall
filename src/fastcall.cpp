#include "deps.h"
#include "dynloadStuff.h"

using namespace v8;
using namespace fastcall;

NAN_MODULE_INIT(InitAll)
{
    InitDyncallStuff(target);
}

NODE_MODULE(fastcall, initAll)
