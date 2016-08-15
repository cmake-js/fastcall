#include "deps.h"
#include "dynloadwrapper.h"
#include "librarybase.h"
#include "functionbase.h"

using namespace v8;
using namespace fastcall;

NAN_MODULE_INIT(InitAll)
{
    InitDyncallWrapper(target);
    LibraryBase::Init(target);
    FunctionBase::Init(target);
}

NODE_MODULE(fastcall, InitAll)
