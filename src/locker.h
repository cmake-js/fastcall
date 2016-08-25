#pragma once
#include <nan.h>

namespace fastcall {
struct Locker {
    friend struct Lock;
    
    Locker(const Locker&) = delete;
    Locker(Locker&&) = delete;
    Locker() 
    {
        uv_mutex_init(&mutex);
    }
    ~Locker()
    {
        uv_mutex_destroy(&mutex);
    }
private:
    uv_mutex_t mutex;
};

struct Lock
{
    Lock() = delete;
    Lock(const Lock&) = delete;
    Lock(Lock&& other)
        : pMutex(other.pMutex)
    {
        other.pMutex = nullptr;
    }
    Lock(Locker& locker)
        : pMutex(&locker.mutex)
    {
        uv_mutex_lock(pMutex);
    }
    ~Lock() 
    {
        if (pMutex) {
            uv_mutex_unlock(pMutex);
        }
    }
private:
    uv_mutex_t* pMutex;
};
}
