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
#include <mutex>

namespace fastcall {
struct Locker {
    friend struct Lock;

    Locker(const Locker&) = delete;
    Locker(Locker&&) = delete;
    Locker()
    {
    }
private:
    std::recursive_mutex mutex;
};

struct Lock
{
    Lock() = delete;
    Lock(const Lock&) = delete;
    Lock(Lock&& other)
        : locker(std::move(other.locker))
    {
    }
    Lock(Locker& locker)
        : locker(locker.mutex)
    {
    }
private:
    std::unique_lock<std::recursive_mutex> locker;
};
}
