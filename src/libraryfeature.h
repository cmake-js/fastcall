#pragma once
#include "locker.h"
#include "instance.h"

namespace fastcall {
struct LibraryBase;

struct LibraryFeature : Instance {
    explicit LibraryFeature(LibraryBase* library);

    LibraryBase* GetLibrary();
    Lock AcquireLock();
private:
    LibraryBase* library;
};

inline LibraryFeature::LibraryFeature(LibraryBase* library)
    : library(library)
{
}

inline LibraryBase*LibraryFeature::GetLibrary()
{
    return library;
}
}
