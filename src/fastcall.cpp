#include "deps.h"
#include "dynloadstuff.h"
#include "librarybase.h"
#include "functionbase.h"

using namespace v8;
using namespace fastcall;

NAN_MODULE_INIT(InitAll)
{
    InitDyncallStuff(target);
    LibraryBase::Init(target);
    FunctionBase::Init(target);
}

NODE_MODULE(fastcall, InitAll)
