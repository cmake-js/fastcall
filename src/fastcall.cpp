/*
Copyright 2016 Gábor Mező (gabor.mezo@outlook.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

#include "deps.h"
#include "dynloadwrapper.h"
#include "dyncallwrapper.h"
#include "dyncallbackwrapper.h"
#include "mutex.h"
#include "weak.h"
#include "statics.h"

using namespace v8;
using namespace fastcall;

NAN_MODULE_INIT(InitAll)
{
    InitStatics(target);
    InitDynloadWrapper(target);
    InitDyncallWrapper(target);
    InitCallbackWrapper(target);
    InitMutex(target);
    InitWeak(target);
    InitStatics(target);
}

NODE_MODULE(fastcall, InitAll)
