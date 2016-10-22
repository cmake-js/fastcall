#include "deps.h"
#include "dynloadwrapper.h"
#include "librarybase.h"
#include "statics.h"

using namespace v8;
using namespace fastcall;

NAN_MODULE_INIT(InitAll)
{
    InitStatics(target);
    InitDynloadWrapper(target);
    LibraryBase::Init(target);
}

NODE_MODULE(fastcall, InitAll)
