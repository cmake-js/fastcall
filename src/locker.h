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
