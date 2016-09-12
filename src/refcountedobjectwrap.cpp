#include "refcountedobjectwrap.h"
#include "deps.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

void RefCountedObjecWrap::AddRef(const v8::Local<Object>& self)
{
    ++refCount;
    if (refCount == 1) {
        ref.Reset(self);
    }
}

void RefCountedObjecWrap::Release()
{
    --refCount;
    assert(refCount >= 0);
    if (refCount == 0) {
        ref.Reset();
    }
}
