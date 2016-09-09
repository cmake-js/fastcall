#include "libraryfeature.h"
#include "deps.h"
#include "librarybase.h"

using namespace std;
using namespace v8;
using namespace node;
using namespace fastcall;

Lock LibraryFeature::AcquireLock()
{
    return library->AcquireLock();
}
