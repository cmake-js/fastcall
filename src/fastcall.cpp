#include "deps.h"
#include "dynloadwrapper.h"
#include "librarybase.h"
#include "functionbase.h"
#include "target.h"
#include "asyncresultbase.h"
#include "callbackbase.h"

using namespace v8;
using namespace fastcall;

NAN_MODULE_INIT(InitAll)
{
    InitTarget(target);
    InitDyncallWrapper(target);
    LibraryBase::Init(target);
    FunctionBase::Init(target);
    AsyncResultBase::Init(target);
    CallbackBase::Init(target);
}

NODE_MODULE(fastcall, InitAll)
