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

#pragma once

#include <nan.h>
#include <dyncall.h>
#include <dyncall_callback.h>
#include <dynload.h>
#include <string>
#include <cstring>
#include <functional>
#include <exception>
#include <vector>
#include <cstdint>
#include <memory>
#include <queue>
#include <utility>
#include <mutex>
#include <condition_variable>
#include <cassert>
#include <iostream>
