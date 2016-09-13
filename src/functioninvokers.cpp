#include "functioninvokers.h"
#include "asyncresultbase.h"
#include "deps.h"
#include "functionbase.h"
#include "helpers.h"
#include "int64.h"
#include "librarybase.h"
#include "locker.h"
#include "loop.h"
#include "target.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

namespace {
const unsigned SYNC_CALL_MODE = 1;
const unsigned ASYNC_CALL_MODE = 2;

typedef Nan::Persistent<Object, CopyablePersistentTraits<Object> > TCopyablePersistent;

typedef std::function<void(DCCallVM*, const Nan::FunctionCallbackInfo<v8::Value>&)> TSyncVMInitialzer;
typedef std::function<v8::Local<v8::Value>(DCCallVM*)> TSyncVMInvoker;

typedef std::function<TAsyncFunctionInvoker(const Nan::FunctionCallbackInfo<v8::Value>&, TAsyncResults&)> TAsyncVMInitialzer;
typedef std::function<TAsyncFunctionInvoker(const v8::Local<Object>& asyncResult)> TAsyncVMInvoker;

#define dcArgInt8 dcArgChar

inline void dcArgUInt8(DCCallVM* vm, unsigned char p)
{
    dcArgChar(vm, reinterpret_cast<char&>(p));
}

#define dcCallInt8 dcCallChar

#define dcArgInt16 dcArgShort

inline void dcArgUInt16(DCCallVM* vm, unsigned short p)
{
    dcArgShort(vm, reinterpret_cast<short&>(p));
}

#define dcCallInt16 dcCallShort

#define dcArgInt32 dcArgInt

inline void dcArgUInt32(DCCallVM* vm, unsigned int p)
{
    dcArgInt(vm, reinterpret_cast<int&>(p));
}

#define dcCallInt32 dcCallInt

#define dcArgInt64 dcArgLongLong

inline void dcArgUInt64(DCCallVM* vm, unsigned long long p)
{
    dcArgLongLong(vm, reinterpret_cast<long long&>(p));
}

#define dcCallInt64 dcCallLongLong

#define dcArgByte dcArgUInt8

inline void dcArgUChar(DCCallVM* vm, unsigned char p)
{
    dcArgChar(vm, reinterpret_cast<char&>(p));
}

inline void dcArgUShort(DCCallVM* vm, unsigned short p)
{
    dcArgShort(vm, reinterpret_cast<short&>(p));
}

inline void dcArgUInt(DCCallVM* vm, unsigned int p)
{
    dcArgInt(vm, reinterpret_cast<int&>(p));
}

inline void dcArgULong(DCCallVM* vm, unsigned long p)
{
    dcArgLong(vm, reinterpret_cast<long&>(p));
}

inline void dcArgULongLong(DCCallVM* vm, unsigned long long p)
{
    dcArgLong(vm, reinterpret_cast<long long&>(p));
}

inline void dcArgSizeT(DCCallVM* vm, size_t p)
{
    auto tmp = static_cast<unsigned long long>(p);
    dcArgLongLong(vm, reinterpret_cast<long long&>(tmp));
}

#define dcArgBool dcArgUInt8

inline uint8_t dcCallUInt8(DCCallVM* vm, void* f)
{
    int8_t tmp = dcCallInt8(vm, f);
    return reinterpret_cast<uint8_t&>(tmp);
}

inline uint16_t dcCallUInt16(DCCallVM* vm, void* f)
{
    int16_t tmp = dcCallInt16(vm, f);
    return reinterpret_cast<uint16_t&>(tmp);
}

inline uint32_t dcCallUInt32(DCCallVM* vm, void* f)
{
    int32_t tmp = dcCallInt32(vm, f);
    return reinterpret_cast<uint32_t&>(tmp);
}

inline uint64_t dcCallUInt64(DCCallVM* vm, void* f)
{
    int64_t tmp = dcCallInt64(vm, f);
    return reinterpret_cast<uint64_t&>(tmp);
}

#define dcCallByte dcCallUInt8

inline unsigned char dcCallUChar(DCCallVM* vm, void* f)
{
    char tmp = dcCallChar(vm, f);
    return reinterpret_cast<unsigned char&>(tmp);
}

inline unsigned short dcCallUShort(DCCallVM* vm, void* f)
{
    short tmp = dcCallShort(vm, f);
    return reinterpret_cast<unsigned short&>(tmp);
}

inline unsigned int dcCallUInt(DCCallVM* vm, void* f)
{
    int tmp = dcCallInt(vm, f);
    return reinterpret_cast<unsigned int&>(tmp);
}

inline unsigned long dcCallULong(DCCallVM* vm, void* f)
{
    long tmp = dcCallLong(vm, f);
    return reinterpret_cast<unsigned long&>(tmp);
}

inline unsigned long long dcCallULongLong(DCCallVM* vm, void* f)
{
    long long tmp = dcCallLongLong(vm, f);
    return reinterpret_cast<unsigned long long&>(tmp);
}

inline size_t dcCallSizeT(DCCallVM* vm, void* f)
{
    long long tmp = dcCallLongLong(vm, f);
    return reinterpret_cast<size_t&>(tmp);
}

inline void* GetPointerAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    Nan::HandleScope scope;

    auto val = info[index];
    if (val->IsNull() || val->IsUndefined()) {
        return nullptr;
    }
    auto obj = val.As<Object>();
    if (!Buffer::HasInstance(obj)) {
        throw logic_error(string("Argument at index ") + to_string(index) + " is not a pointer.");
    }
    return reinterpret_cast<void*>(Buffer::Data(obj));
}

inline int8_t GetInt8At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int8_t>(info[index]->Int32Value());
}

inline uint8_t GetUInt8At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<uint8_t>(info[index]->Uint32Value());
}

inline int16_t GetInt16At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int16_t>(info[index]->Int32Value());
}

inline uint16_t GetUInt16At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<uint16_t>(info[index]->Uint32Value());
}

inline int32_t GetInt32At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int32_t>(info[index]->Int32Value());
}

inline uint32_t GetUInt32At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<uint32_t>(info[index]->Uint32Value());
}

inline int64_t GetInt64At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return GetInt64(info[index]);
}

inline uint64_t GetUInt64At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return GetUint64(info[index]);
}

inline float GetFloatAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<float>(info[index]->NumberValue());
}

inline double GetDoubleAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return info[index]->NumberValue();
}

inline char GetCharAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<char>(GetInt16At(info, index));
}

inline unsigned char GetUCharAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned char>(GetUInt16At(info, index));
}

inline uint8_t GetByteAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return GetUInt8At(info, index);
}

inline short GetShortAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<short>(GetInt16At(info, index));
}

inline unsigned short GetUShortAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned short>(GetUInt16At(info, index));
}

inline int GetIntAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int>(GetInt32At(info, index));
}

inline unsigned int GetUIntAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned int>(GetUInt32At(info, index));
}

inline long GetLongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<long>(GetInt64At(info, index));
}

inline unsigned long GetULongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned long>(GetUInt64At(info, index));
}

inline long long GetLongLongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<long long>(GetInt64At(info, index));
}

inline unsigned long long GetULongLongAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<unsigned long long>(GetUInt64At(info, index));
}

inline size_t GetSizeTAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<size_t>(GetUInt64At(info, index));
}

inline bool GetBoolAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return info[index]->BooleanValue();
}

inline AsyncResultBase* AsAsyncResultBase(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    Nan::HandleScope scope;

    return AsyncResultBase::AsAsyncResultBase(info[index].As<Object>());
}

template <typename T>
inline T* AsAsyncResultPtr(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    auto basePtr = AsAsyncResultBase(info, index);
    if (!basePtr) {
        return nullptr;
    }
    return basePtr->GetPtr<T>();
}

inline v8::Local<v8::Object> GetResultPointerType(v8::Local<v8::Object> refType)
{
    Nan::EscapableHandleScope scope;

    auto ref = RequireRef();
    auto derefType = GetValue<Function>(ref, "derefType");
    assert(!derefType.IsEmpty());
    v8::Local<v8::Value> args[] = { refType };
    auto result = Nan::Call(derefType, ref, 1, args).ToLocalChecked().As<Object>();
    assert(!result.IsEmpty());
    return scope.Escape(result);
}

template <typename T, typename F, typename G>
TSyncVMInitialzer MakeSyncArgProcessor(unsigned i, const F& f, const G& g)
{
    return [=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
        T* valPtr = AsAsyncResultPtr<T>(info, i);
        if (valPtr) {
            f(vm, *valPtr);
        } else {
            f(vm, g(info, i));
        }
    };
}

TSyncVMInitialzer MakeSyncVMInitializer(const v8::Local<Object>& func)
{
    Nan::HandleScope scope;

    std::vector<TSyncVMInitialzer> list;

    auto args = GetValue<Array>(func, "args");
    unsigned length = args->Length();
    list.reserve(length);
    for (unsigned i = 0; i < length; i++) {
        auto arg = args->Get(i).As<Object>();
        auto type = GetValue<Object>(arg, "type");
        auto typeName = *Nan::Utf8String(GetValue<String>(type, "name"));
        auto indirection = GetValue(type, "indirection")->Uint32Value();
        if (indirection > 1) {
            // pointer:
            list.emplace_back(MakeSyncArgProcessor<void*>(i, dcArgPointer, GetPointerAt));
            continue;
        } else if (indirection == 1) {
            if (!strcmp(typeName, "int8")) {
                list.emplace_back(MakeSyncArgProcessor<int8_t>(i, dcArgInt8, GetInt8At));
                continue;
            }
            if (!strcmp(typeName, "uint8")) {
                list.emplace_back(MakeSyncArgProcessor<uint8_t>(i, dcArgUInt8, GetUInt8At));
                continue;
            }
            if (!strcmp(typeName, "int16")) {
                list.emplace_back(MakeSyncArgProcessor<int16_t>(i, dcArgInt16, GetInt16At));
                continue;
            }
            if (!strcmp(typeName, "uint16")) {
                list.emplace_back(MakeSyncArgProcessor<uint16_t>(i, dcArgUInt16, GetUInt16At));
                continue;
            }
            if (!strcmp(typeName, "int32")) {
                list.emplace_back(MakeSyncArgProcessor<int32_t>(i, dcArgInt32, GetInt32At));
                continue;
            }
            if (!strcmp(typeName, "uint32")) {
                list.emplace_back(MakeSyncArgProcessor<uint32_t>(i, dcArgUInt32, GetUInt32At));
                continue;
            }
            if (!strcmp(typeName, "int64")) {
                list.emplace_back(MakeSyncArgProcessor<int64_t>(i, dcArgInt64, GetInt64At));
                continue;
            }
            if (!strcmp(typeName, "uint64")) {
                list.emplace_back(MakeSyncArgProcessor<uint64_t>(i, dcArgUInt64, GetUInt64At));
                continue;
            }
            if (!strcmp(typeName, "float")) {
                list.emplace_back(MakeSyncArgProcessor<float>(i, dcArgFloat, GetFloatAt));
                continue;
            }
            if (!strcmp(typeName, "double")) {
                list.emplace_back(MakeSyncArgProcessor<double>(i, dcArgDouble, GetDoubleAt));
                continue;
            }
            if (!strcmp(typeName, "char")) {
                list.emplace_back(MakeSyncArgProcessor<char>(i, dcArgChar, GetCharAt));
                continue;
            }
            if (!strcmp(typeName, "byte")) {
                list.emplace_back(MakeSyncArgProcessor<uint8_t>(i, dcArgByte, GetByteAt));
                continue;
            }
            if (!strcmp(typeName, "uchar")) {
                list.emplace_back(MakeSyncArgProcessor<unsigned char>(i, dcArgUChar, GetUCharAt));
                continue;
            }
            if (!strcmp(typeName, "short")) {
                list.emplace_back(MakeSyncArgProcessor<short>(i, dcArgShort, GetShortAt));
                continue;
            }
            if (!strcmp(typeName, "ushort")) {
                list.emplace_back(MakeSyncArgProcessor<unsigned short>(i, dcArgUShort, GetUShortAt));
                continue;
            }
            if (!strcmp(typeName, "int")) {
                list.emplace_back(MakeSyncArgProcessor<int>(i, dcArgInt, GetIntAt));
                continue;
            }
            if (!strcmp(typeName, "uint")) {
                list.emplace_back(MakeSyncArgProcessor<unsigned int>(i, dcArgUInt, GetUIntAt));
                continue;
            }
            if (!strcmp(typeName, "long")) {
                list.emplace_back(MakeSyncArgProcessor<long>(i, dcArgLong, GetLongAt));
                continue;
            }
            if (!strcmp(typeName, "ulong")) {
                list.emplace_back(MakeSyncArgProcessor<unsigned long>(i, dcArgULong, GetULongAt));
                continue;
            }
            if (!strcmp(typeName, "longlong")) {
                list.emplace_back(MakeSyncArgProcessor<long long>(i, dcArgLongLong, GetLongLongAt));
                continue;
            }
            if (!strcmp(typeName, "ulonglong")) {
                list.emplace_back(MakeSyncArgProcessor<unsigned long long>(i, dcArgULongLong, GetULongLongAt));
                continue;
            }
            if (!strcmp(typeName, "bool")) {
                list.emplace_back(MakeSyncArgProcessor<bool>(i, dcArgBool, GetBoolAt));
                continue;
            }
            if (!strcmp(typeName, "size_t")) {
                list.emplace_back(MakeSyncArgProcessor<size_t>(i, dcArgSizeT, GetSizeTAt));
                continue;
            }
        }

        throw logic_error(string("Invalid argument type definition at: ") + to_string(i) + ".");
    }

    return [=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
        dcReset(vm);
        for (auto& f : list) {
            f(vm, info);
        }
    };
}

template <typename T, typename F, typename G>
TAsyncVMInitialzer MakeAsyncArgProcessor(unsigned i, F f, const G& g)
{
    return [=](const Nan::FunctionCallbackInfo<v8::Value>& info, TAsyncResults& asyncResults) {
        auto ar = AsAsyncResultBase(info, i);
        TAsyncFunctionInvoker result;
        if (ar) {
            ar->AddRef(info[i].As<Object>());
            asyncResults.push_back(ar);
            T* valPtr = ar->GetPtr<T>();
            result = [=](DCCallVM* vm) {
                f(vm, *valPtr);
            };
        } else {
            auto value = g(info, i);
            result = [=](DCCallVM* vm) {
                f(vm, value);
            };
        }
        return result;
    };
}

TAsyncVMInitialzer MakeAsyncVMInitializer(const v8::Local<Object>& func)
{
    Nan::HandleScope scope;

    std::vector<TAsyncVMInitialzer> list;

    auto args = GetValue<Array>(func, "args");
    unsigned length = args->Length();
    list.reserve(length);
    for (unsigned i = 0; i < length; i++) {
        auto arg = args->Get(i).As<Object>();
        auto type = GetValue<Object>(arg, "type");
        auto typeName = *Nan::Utf8String(GetValue<String>(type, "name"));
        auto indirection = GetValue(type, "indirection")->Uint32Value();
        if (indirection > 1) {
            // pointer:
            list.emplace_back(MakeAsyncArgProcessor<void*>(i, dcArgPointer, GetPointerAt));
            continue;
        } else if (indirection == 1) {
            if (!strcmp(typeName, "int8")) {
                list.emplace_back(MakeAsyncArgProcessor<int8_t>(i, dcArgInt8, GetInt8At));
                continue;
            }
            if (!strcmp(typeName, "uint8")) {
                list.emplace_back(MakeAsyncArgProcessor<uint8_t>(i, dcArgUInt8, GetUInt8At));
                continue;
            }
            if (!strcmp(typeName, "int16")) {
                list.emplace_back(MakeAsyncArgProcessor<int16_t>(i, dcArgInt16, GetInt16At));
                continue;
            }
            if (!strcmp(typeName, "uint16")) {
                list.emplace_back(MakeAsyncArgProcessor<uint16_t>(i, dcArgUInt16, GetUInt16At));
                continue;
            }
            if (!strcmp(typeName, "int32")) {
                list.emplace_back(MakeAsyncArgProcessor<int32_t>(i, dcArgInt32, GetInt32At));
                continue;
            }
            if (!strcmp(typeName, "uint32")) {
                list.emplace_back(MakeAsyncArgProcessor<uint32_t>(i, dcArgUInt32, GetUInt32At));
                continue;
            }
            if (!strcmp(typeName, "int64")) {
                list.emplace_back(MakeAsyncArgProcessor<int64_t>(i, dcArgInt64, GetInt64At));
                continue;
            }
            if (!strcmp(typeName, "uint64")) {
                list.emplace_back(MakeAsyncArgProcessor<uint64_t>(i, dcArgUInt64, GetUInt64At));
                continue;
            }
            if (!strcmp(typeName, "float")) {
                list.emplace_back(MakeAsyncArgProcessor<float>(i, dcArgFloat, GetFloatAt));
                continue;
            }
            if (!strcmp(typeName, "double")) {
                list.emplace_back(MakeAsyncArgProcessor<double>(i, dcArgDouble, GetDoubleAt));
                continue;
            }
            if (!strcmp(typeName, "char")) {
                list.emplace_back(MakeAsyncArgProcessor<char>(i, dcArgChar, GetCharAt));
                continue;
            }
            if (!strcmp(typeName, "byte")) {
                list.emplace_back(MakeAsyncArgProcessor<uint8_t>(i, dcArgByte, GetByteAt));
                continue;
            }
            if (!strcmp(typeName, "uchar")) {
                list.emplace_back(MakeAsyncArgProcessor<unsigned char>(i, dcArgUChar, GetUCharAt));
                continue;
            }
            if (!strcmp(typeName, "short")) {
                list.emplace_back(MakeAsyncArgProcessor<short>(i, dcArgShort, GetShortAt));
                continue;
            }
            if (!strcmp(typeName, "ushort")) {
                list.emplace_back(MakeAsyncArgProcessor<unsigned short>(i, dcArgUShort, GetUShortAt));
                continue;
            }
            if (!strcmp(typeName, "int")) {
                list.emplace_back(MakeAsyncArgProcessor<int>(i, dcArgInt, GetIntAt));
                continue;
            }
            if (!strcmp(typeName, "uint")) {
                list.emplace_back(MakeAsyncArgProcessor<unsigned int>(i, dcArgUInt, GetUIntAt));
                continue;
            }
            if (!strcmp(typeName, "long")) {
                list.emplace_back(MakeAsyncArgProcessor<long>(i, dcArgLong, GetLongAt));
                continue;
            }
            if (!strcmp(typeName, "ulong")) {
                list.emplace_back(MakeAsyncArgProcessor<unsigned long>(i, dcArgULong, GetULongAt));
                continue;
            }
            if (!strcmp(typeName, "longlong")) {
                list.emplace_back(MakeAsyncArgProcessor<long long>(i, dcArgLongLong, GetLongLongAt));
                continue;
            }
            if (!strcmp(typeName, "ulonglong")) {
                list.emplace_back(MakeAsyncArgProcessor<unsigned long long>(i, dcArgULongLong, GetULongLongAt));
                continue;
            }
            if (!strcmp(typeName, "bool")) {
                list.emplace_back(MakeAsyncArgProcessor<bool>(i, dcArgBool, GetBoolAt));
                continue;
            }
            if (!strcmp(typeName, "size_t")) {
                list.emplace_back(MakeAsyncArgProcessor<size_t>(i, dcArgSizeT, GetSizeTAt));
                continue;
            }
        }

        throw logic_error(string("Invalid argument type definition at: ") + to_string(i) + ".");
    }

    return [=](const Nan::FunctionCallbackInfo<v8::Value>& info, TAsyncResults& asyncResults) {
        std::vector<TAsyncFunctionInvoker> invokers;
        invokers.reserve(list.size());
        for (auto& f : list) {
            invokers.emplace_back(f(info, asyncResults));
        }

        return bind(
            [=](const std::vector<TAsyncFunctionInvoker>& invokers, DCCallVM* vm) {
                dcReset(vm);
                for (auto& f : invokers) {
                    f(vm);
                }
            },
            std::move(invokers),
            std::placeholders::_1);
    };
}

template <typename T, typename F>
TSyncVMInvoker MakeSyncVMInvoker(const F& f, void* funcPtr)
{
    return [=](DCCallVM* vm) {
        T result = f(vm, funcPtr);
        return Nan::New(result);
    };
}

template <typename F>
TSyncVMInvoker MakeSyncInt64VMInvoker(const F& f, void* funcPtr)
{
    return [=](DCCallVM* vm) {
        int64_t result = f(vm, funcPtr);
        return MakeInt64(result);
    };
}

template <typename F>
TSyncVMInvoker MakeSyncUint64VMInvoker(const F& f, void* funcPtr)
{
    return [=](DCCallVM* vm) {
        uint64_t result = f(vm, funcPtr);
        return MakeUint64(result);
    };
}

template <typename F>
TSyncVMInvoker MakeSyncVoidVMInvoker(const F& f, void* funcPtr)
{
    return [=](DCCallVM* vm) {
        f(vm, funcPtr);
        return Nan::Undefined();
    };
}

TSyncVMInvoker MakeSyncVMInvoker(void* funcPtr, const TCopyablePersistent& resultPointerTypeHolder)
{
    return [=](DCCallVM* vm) {
        Nan::EscapableHandleScope scope;

        void* result = dcCallPointer(vm, funcPtr);
        auto ref = WrapPointer(result);
        SetValue(ref, "type", Nan::New(resultPointerTypeHolder));
        return scope.Escape(ref);
    };
}

TSyncVMInvoker MakeSyncVMInvoker(const v8::Local<Object>& func)
{
    Nan::HandleScope scope;

    auto resultType = GetValue<Object>(func, "resultType");
    auto resultTypeName = string(*Nan::Utf8String(GetValue<String>(resultType, "name")));
    auto indirection = GetValue(resultType, "indirection")->Uint32Value();
    void* funcPtr = FunctionBase::GetFuncPtr(func);

    assert(GetValue(func, "callMode")->Uint32Value() == SYNC_CALL_MODE);

    if (indirection > 1) {
        auto resultPointerType = GetResultPointerType(resultType);
        auto resultPointerTypeHolder = TCopyablePersistent();
        resultPointerTypeHolder.Reset(resultPointerType);
        return MakeSyncVMInvoker(funcPtr, resultPointerTypeHolder);
    } else if (indirection == 1) {
        auto typeName = resultTypeName.c_str();

        if (!strcmp(typeName, "void")) {
            return MakeSyncVoidVMInvoker(dcCallVoid, funcPtr);
        }
        if (!strcmp(typeName, "int8")) {
            return MakeSyncVMInvoker<int8_t>(dcCallInt8, funcPtr);
        }
        if (!strcmp(typeName, "uint8")) {
            return MakeSyncVMInvoker<uint8_t>(dcCallUInt8, funcPtr);
        }
        if (!strcmp(typeName, "int16")) {
            return MakeSyncVMInvoker<int16_t>(dcCallInt16, funcPtr);
        }
        if (!strcmp(typeName, "uint16")) {
            return MakeSyncVMInvoker<uint16_t>(dcCallUInt16, funcPtr);
        }
        if (!strcmp(typeName, "int32")) {
            return MakeSyncVMInvoker<int32_t>(dcCallInt32, funcPtr);
        }
        if (!strcmp(typeName, "uint32")) {
            return MakeSyncVMInvoker<uint32_t>(dcCallUInt32, funcPtr);
        }
        if (!strcmp(typeName, "int64")) {
            return MakeSyncInt64VMInvoker(dcCallInt64, funcPtr);
        }
        if (!strcmp(typeName, "uint64")) {
            return MakeSyncUint64VMInvoker(dcCallUInt64, funcPtr);
        }
        if (!strcmp(typeName, "float")) {
            return MakeSyncVMInvoker<float>(dcCallFloat, funcPtr);
        }
        if (!strcmp(typeName, "double")) {
            return MakeSyncVMInvoker<double>(dcCallDouble, funcPtr);
        }
        if (!strcmp(typeName, "char")) {
            return MakeSyncVMInvoker<char>(dcCallChar, funcPtr);
        }
        if (!strcmp(typeName, "byte")) {
            return MakeSyncVMInvoker<uint8_t>(dcCallUInt8, funcPtr);
        }
        if (!strcmp(typeName, "uchar")) {
            return MakeSyncVMInvoker<unsigned char>(dcCallUChar, funcPtr);
        }
        if (!strcmp(typeName, "short")) {
            return MakeSyncVMInvoker<short>(dcCallShort, funcPtr);
        }
        if (!strcmp(typeName, "ushort")) {
            return MakeSyncVMInvoker<unsigned short>(dcCallUShort, funcPtr);
        }
        if (!strcmp(typeName, "int")) {
            return MakeSyncVMInvoker<int>(dcCallInt, funcPtr);
        }
        if (!strcmp(typeName, "uint")) {
            return MakeSyncVMInvoker<unsigned int>(dcCallUInt, funcPtr);
        }
        if (!strcmp(typeName, "long")) {
            return MakeSyncInt64VMInvoker(dcCallLong, funcPtr);
        }
        if (!strcmp(typeName, "ulong")) {
            return MakeSyncUint64VMInvoker(dcCallULong, funcPtr);
        }
        if (!strcmp(typeName, "longlong")) {
            return MakeSyncInt64VMInvoker(dcCallLongLong, funcPtr);
        }
        if (!strcmp(typeName, "ulonglong")) {
            return MakeSyncUint64VMInvoker(dcCallULongLong, funcPtr);
        }
        if (!strcmp(typeName, "bool")) {
            return MakeSyncVMInvoker<bool>(dcCallBool, funcPtr);
        }
        if (!strcmp(typeName, "size_t")) {
            return MakeSyncUint64VMInvoker(dcCallSizeT, funcPtr);
        }
    }
    throw logic_error("Invalid resultType.");
}

template <typename T, typename F>
TAsyncVMInvoker MakeAsyncVMInvoker(F f, void* funcPtr)
{
    return [=](const v8::Local<Object>& asyncResult) {
        auto ar = AsyncResultBase::GetAsyncResultBase(asyncResult);
        assert(ar);
        T* valPtr = ar->GetPtr<T>();
        assert(valPtr);
        return [=](DCCallVM* vm) {
            T result = f(vm, funcPtr);
            *valPtr = result;
        };
    };
}

template <typename F>
TAsyncVMInvoker MakeAsyncVoidVMInvoker(F f, void* funcPtr)
{
    return [=](const v8::Local<Object>& x) {
        return [=](DCCallVM* vm) {
            f(vm, funcPtr);
        };
    };
}

TAsyncVMInvoker MakeAsyncVMInvoker(const v8::Local<Object>& func)
{
    Nan::HandleScope scope;

    auto resultType = GetValue<Object>(func, "resultType");
    auto resultTypeName = string(*Nan::Utf8String(GetValue<String>(resultType, "name")));
    auto indirection = GetValue(resultType, "indirection")->Uint32Value();
    void* funcPtr = FunctionBase::GetFuncPtr(func);

    assert(GetValue(func, "callMode")->Uint32Value() == ASYNC_CALL_MODE);

    if (indirection > 1) {
        return MakeAsyncVMInvoker<void*>(dcCallPointer, funcPtr);
    } else if (indirection == 1) {
        auto typeName = resultTypeName.c_str();

        if (!strcmp(typeName, "void")) {
            return MakeAsyncVoidVMInvoker(dcCallVoid, funcPtr);
        }
        if (!strcmp(typeName, "int8")) {
            return MakeAsyncVMInvoker<int8_t>(dcCallInt8, funcPtr);
        }
        if (!strcmp(typeName, "uint8")) {
            return MakeAsyncVMInvoker<uint8_t>(dcCallUInt8, funcPtr);
        }
        if (!strcmp(typeName, "int16")) {
            return MakeAsyncVMInvoker<int16_t>(dcCallInt16, funcPtr);
        }
        if (!strcmp(typeName, "uint16")) {
            return MakeAsyncVMInvoker<uint16_t>(dcCallUInt16, funcPtr);
        }
        if (!strcmp(typeName, "int32")) {
            return MakeAsyncVMInvoker<int32_t>(dcCallInt32, funcPtr);
        }
        if (!strcmp(typeName, "uint32")) {
            return MakeAsyncVMInvoker<uint32_t>(dcCallUInt32, funcPtr);
        }
        if (!strcmp(typeName, "int64")) {
            return MakeAsyncVMInvoker<int64_t>(dcCallInt64, funcPtr);
        }
        if (!strcmp(typeName, "uint64")) {
            return MakeAsyncVMInvoker<uint64_t>(dcCallUInt64, funcPtr);
        }
        if (!strcmp(typeName, "float")) {
            return MakeAsyncVMInvoker<float>(dcCallFloat, funcPtr);
        }
        if (!strcmp(typeName, "double")) {
            return MakeAsyncVMInvoker<double>(dcCallDouble, funcPtr);
        }
        if (!strcmp(typeName, "char")) {
            return MakeAsyncVMInvoker<char>(dcCallChar, funcPtr);
        }
        if (!strcmp(typeName, "byte")) {
            return MakeAsyncVMInvoker<uint8_t>(dcCallUInt8, funcPtr);
        }
        if (!strcmp(typeName, "uchar")) {
            return MakeAsyncVMInvoker<unsigned char>(dcCallUChar, funcPtr);
        }
        if (!strcmp(typeName, "short")) {
            return MakeAsyncVMInvoker<short>(dcCallShort, funcPtr);
        }
        if (!strcmp(typeName, "ushort")) {
            return MakeAsyncVMInvoker<unsigned short>(dcCallUShort, funcPtr);
        }
        if (!strcmp(typeName, "int")) {
            return MakeAsyncVMInvoker<int>(dcCallInt, funcPtr);
        }
        if (!strcmp(typeName, "uint")) {
            return MakeAsyncVMInvoker<unsigned int>(dcCallUInt, funcPtr);
        }
        if (!strcmp(typeName, "long")) {
            return MakeAsyncVMInvoker<long>(dcCallLong, funcPtr);
        }
        if (!strcmp(typeName, "ulong")) {
            return MakeAsyncVMInvoker<unsigned long>(dcCallULong, funcPtr);
        }
        if (!strcmp(typeName, "longlong")) {
            return MakeAsyncVMInvoker<long long>(dcCallLongLong, funcPtr);
        }
        if (!strcmp(typeName, "ulonglong")) {
            return MakeAsyncVMInvoker<unsigned long long>(dcCallULongLong, funcPtr);
        }
        if (!strcmp(typeName, "bool")) {
            return MakeAsyncVMInvoker<bool>(dcCallBool, funcPtr);
        }
        if (!strcmp(typeName, "size_t")) {
            return MakeAsyncVMInvoker<size_t>(dcCallSizeT, funcPtr);
        }
    }
    throw logic_error("Invalid resultType.");
}
}

TFunctionInvoker fastcall::MakeFunctionInvoker(const v8::Local<Object>& func)
{
    unsigned callMode = GetValue(func, "callMode")->Uint32Value();
    auto funcBase = FunctionBase::GetFunctionBase(func);

    if (callMode == SYNC_CALL_MODE) {
        auto initializer = MakeSyncVMInitializer(func);
        auto invoker = MakeSyncVMInvoker(func);
        return [funcBase, initializer, invoker](const Nan::FunctionCallbackInfo<v8::Value>& info) {
            auto lock(funcBase->GetLibrary()->AcquireLock());
            initializer(funcBase->GetVM(), info);
            return invoker(funcBase->GetVM());
        };
    } else if (callMode == ASYNC_CALL_MODE) {
        auto initializer = MakeAsyncVMInitializer(func);
        auto invoker = MakeAsyncVMInvoker(func);
        // Note: this branch's invocation and stuff gets locked in the Loop.
        funcBase->GetLibrary()->EnsureAsyncSupport();
        return [funcBase, initializer, invoker](const Nan::FunctionCallbackInfo<v8::Value>& info) {
            Nan::EscapableHandleScope scope;

            TAsyncResults asyncResults;
            asyncResults.reserve(info.Length() + 1);
            auto resultType = GetValue<Object>(info.This(), "resultType");
            auto asyncResult = MakeAsyncResult(info.This(), resultType);
            auto ar = AsyncResultBase::GetAsyncResultBase(asyncResult);
            asyncResults.push_back(ar);
            auto currentInitializer = initializer(info, asyncResults);
            auto currentInvoker = invoker(asyncResult);
            funcBase->GetLibrary()->GetLoop()->Push(
                make_pair(
                    TOptionalAsyncResults(std::move(asyncResults)),
                    [=](DCCallVM* vm) {
                        currentInitializer(vm);
                        currentInvoker(vm);
                    }));

            return scope.Escape(asyncResult);
        };

    } else {
        throw logic_error("Unknown call mode.");
    }
}
