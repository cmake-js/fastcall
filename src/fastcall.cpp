#include "deps.h"
#include "dyncallStuff.h"

using namespace v8;
using namespace fastcall;

NAN_MODULE_INIT(initAll)
{
    initDyncallStuff(target);
}

NODE_MODULE(fastcall, initAll)
