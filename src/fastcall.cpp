#include "deps.h"

using namespace v8;
using namespace Nan;

NAN_MODULE_INIT(InitAll) {
    // Set(target, New<String>("calculateSync").ToLocalChecked(), GetFunction(New<FunctionTemplate>(CalculateSync)).ToLocalChecked());
}

NODE_MODULE(addon, InitAll)