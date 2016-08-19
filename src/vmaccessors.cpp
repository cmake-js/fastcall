#include "vmaccessors.h"
#include "deps.h"
#include "helpers.h"
#include "functionbase.h"

#define dcArgInt8 dcArgChar
#define dcArgUInt8(vm, p) { auto tmp = p; dcArgChar(vm, reinterpret_cast<char&>(tmp)); }
#define dcCallInt8 dcCallChar

#define dcArgInt16 dcArgShort
#define dcArgUInt16(vm, p) { auto tmp = p; dcArgShort(vm, reinterpret_cast<short&>(tmp)); }
#define dcCallInt16 dcCallShort

#define dcArgInt32 dcArgInt
#define dcArgUInt32(vm, p) { auto tmp = p; dcArgInt(vm, reinterpret_cast<int&>(tmp)); }
#define dcCallInt32 dcCallInt

#define dcArgInt64 dcArgLongLong
#define dcArgUInt64(vm, p) { auto tmp = p; dcArgLongLong(vm, reinterpret_cast<long long&>(tmp)); }
#define dcCallInt64 dcCallLongLong

#define dcArgByte(vm, p) { auto tmp = p; dcArgChar(vm, reinterpret_cast<char&>(tmp)); }

#define dcArgUChar(vm, p) { auto tmp = p; dcArgChar(vm, reinterpret_cast<char&>(tmp)); }

#define dcArgUShort(vm, p) { auto tmp = p; dcArgShort(vm, reinterpret_cast<short&>(tmp)); }

#define dcArgUInt(vm, p) { auto tmp = p; dcArgInt(vm, reinterpret_cast<int&>(tmp)); }

#define dcArgULong(vm, p) { auto tmp = p; dcArgLong(vm, reinterpret_cast<long&>(tmp)); }

#define dcArgULongLong(vm, p) { auto tmp = p; dcArgLongLong(vm, reinterpret_cast<long long&>(tmp)); }

#define dcArgSizeT(vm, p) { auto tmp = p; dcArgLongLong(vm, reinterpret_cast<long long&>(tmp)); }

#define dcArgUChar(vm, p) { auto tmp = p; dcArgChar(vm, reinterpret_cast<char&>(tmp)); }

#define dcArgBool(vm, p) { auto tmp = p; dcArgChar(vm, reinterpret_cast<char&>(tmp)); }

const unsigned syncCallMode = 1;
const unsigned asyncCallMode = 2;

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

namespace {
inline uint8_t dcCallUInt8(DCCallVM* vm, void *f) {
    int8_t tmp = dcCallInt8(vm, f);
    return reinterpret_cast<uint8_t&>(tmp);
}

inline uint16_t dcCallUInt16(DCCallVM* vm, void *f) {
    int16_t tmp = dcCallInt16(vm, f);
    return reinterpret_cast<uint16_t&>(tmp);
}

inline uint32_t dcCallUInt32(DCCallVM* vm, void *f) {
    int32_t tmp = dcCallInt32(vm, f);
    return reinterpret_cast<uint32_t&>(tmp);
}

inline uint64_t dcCallUInt64(DCCallVM* vm, void *f) {
    int64_t tmp = dcCallInt64(vm, f);
    return reinterpret_cast<uint64_t&>(tmp);
}

#define dcCallByte dcCallUInt8

inline unsigned char dcCallUChar(DCCallVM* vm, void *f) {
    char tmp = dcCallChar(vm, f);
    return reinterpret_cast<unsigned char&>(tmp);
}

inline unsigned short dcCallUShort(DCCallVM* vm, void *f) {
    short tmp = dcCallShort(vm, f);
    return reinterpret_cast<unsigned short&>(tmp);
}

inline unsigned int dcCallUInt(DCCallVM* vm, void *f) {
    int tmp = dcCallInt(vm, f);
    return reinterpret_cast<unsigned int&>(tmp);
}

inline unsigned long dcCallULong(DCCallVM* vm, void *f) {
    long tmp = dcCallLong(vm, f);
    return reinterpret_cast<unsigned long&>(tmp);
}

inline unsigned long long dcCallULongLong(DCCallVM* vm, void *f) {
    long long tmp = dcCallLongLong(vm, f);
    return reinterpret_cast<unsigned long long&>(tmp);
}

inline size_t dcCallSizeT(DCCallVM* vm, void *f) {
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
    if (Buffer::HasInstance(obj)) {
        throw new logic_error(string("Argument at index ") + to_string(index) + " is not a pointer.");
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

// TODO: proper 64 bit support, like node-ffi
inline int64_t GetInt64At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<int64_t>(info[index]->NumberValue());
}

// TODO: proper 64 bit support, like node-ffi
inline uint64_t GetUInt64At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<uint64_t>(info[index]->NumberValue());
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

// TODO: proper 64 bit support, like node-ffi
inline size_t GetSizeTAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return static_cast<size_t>(GetUInt64At(info, index));
}

inline bool GetBoolAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return info[index]->BooleanValue();
}

inline v8::Local<v8::Value> GetResultPointerType(v8::Local<v8::Value> refType) {
    Nan::EscapableHandleScope scope;

    auto ref = GetRef();
    auto derefType = GetValue<Function>(ref, "derefType");
    v8::Local<v8::Value> args[] = { refType };
    return scope.Escape(derefType->Call(ref, 1, args));
}
}

TVMInitialzer fastcall::MakeVMInitializer(const v8::Local<Object>& func)
{
    Nan::HandleScope scope;

    std::vector<TVMInitialzer> list;

    auto args = GetValue<Array>(func, "args");
    for (unsigned i = 0, len = args->Length(); i < len; i++) {
        auto arg = args->Get(i).As<Object>();
        auto type = GetValue<Object>(arg, "type");
        auto typeName = *Nan::Utf8String(GetValue<String>(type, "name"));
        auto indirection = GetValue(type, "indirection")->Uint32Value();
        if (indirection > 1) {
            // pointer:
            list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                dcArgPointer(vm, GetPointerAt(info, i));
            });
            continue;
        }
        else if (indirection == 1) {
            if (!strcmp(typeName, "int8")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgInt8(vm, GetInt8At(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "uint8")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgUInt8(vm, GetUInt8At(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "int16")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgInt16(vm, GetInt16At(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "uint16")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgUInt16(vm, GetUInt16At(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "int32")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgInt32(vm, GetInt32At(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "uint32")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgUInt32(vm, GetUInt32At(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "int64")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgInt64(vm, GetInt64At(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "uint64")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgUInt64(vm, GetUInt64At(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "float")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgFloat(vm, GetFloatAt(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "double")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgDouble(vm, GetDoubleAt(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "char")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgChar(vm, GetCharAt(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "byte")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgByte(vm, GetByteAt(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "uchar")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgUChar(vm, GetUCharAt(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "short")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgShort(vm, GetShortAt(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "ushort")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgUShort(vm, GetUShortAt(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "int")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgInt(vm, GetIntAt(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "uint")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgUInt(vm, GetUIntAt(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "long")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgLong(vm, GetLongAt(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "ulong")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgULong(vm, GetULongAt(info, i));
                });
                continue;
            }
            // TODO: proper 64 bit support, like node-ffi
            if (!strcmp(typeName, "longlong")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgLongLong(vm, GetLongLongAt(info, i));
                });
                continue;
            }
            // TODO: proper 64 bit support, like node-ffi
            if (!strcmp(typeName, "ulonglong")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgULongLong(vm, GetULongLongAt(info, i));
                });
                continue;
            }
            if (!strcmp(typeName, "bool")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgBool(vm, GetBoolAt(info, i));
                });
                continue;
            }
            // TODO: proper 64 bit support, like node-ffi
            if (!strcmp(typeName, "size_t")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgSizeT(vm, GetSizeTAt(info, i));
                });
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

TVMInvoker fastcall::MakeSyncVMInvoker(const v8::Local<Object>& func)
{
    Nan::HandleScope scope;

    auto resultType = GetValue<Object>(func, "resultType");
    auto resultTypeName = string(*Nan::Utf8String(GetValue<String>(resultType, "name")));
    auto indirection = GetValue(resultType, "indirection")->Uint32Value();
    void* funcPtr = FunctionBase::FindFuncPtr(func);

    assert(GetValue(func, "callMode")->Uint32Value() == 1);

    if (indirection > 1) {
        return [=](DCCallVM* vm) {
            Nan::EscapableHandleScope scope;

            void* result = dcCallPointer(vm, funcPtr);
            auto ref = WrapPointer(result);
            auto refType = GetResultPointerType(resultType);
            SetValue(ref, "type", refType);
            return scope.Escape(ref);
        };
    }
    else if (indirection == 1) {
        auto typeName = resultTypeName.c_str();

        if (!strcmp(typeName, "void")) {
            return [=](DCCallVM* vm) {
                return Nan::Undefined();
            };
        }
        if (!strcmp(typeName, "int8")) {
            return [=](DCCallVM* vm) {
                int8_t result = dcCallInt8(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "uint8")) {
            return [=](DCCallVM* vm) {
                uint8_t result = dcCallUInt8(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "int16")) {
            return [=](DCCallVM* vm) {
                int16_t result = dcCallInt16(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "uint16")) {
            return [=](DCCallVM* vm) {
                uint16_t result = dcCallUInt16(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "int32")) {
            return [=](DCCallVM* vm) {
                int32_t result = dcCallInt32(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "uint32")) {
            return [=](DCCallVM* vm) {
                uint32_t result = dcCallUInt32(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "int64")) {
            // TODO: proper 64 bit support, like node-ffi
            return [=](DCCallVM* vm) {
                int64_t result = dcCallInt64(vm, funcPtr);
                return Nan::New((double)result);
            };
        }
        if (!strcmp(typeName, "uint64")) {
            // TODO: proper 64 bit support, like node-ffi
            return [=](DCCallVM* vm) {
                uint64_t result = dcCallUInt64(vm, funcPtr);
                return Nan::New((double)result);
            };
        }
        if (!strcmp(typeName, "float")) {
            return [=](DCCallVM* vm) {
                float result = dcCallFloat(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "double")) {
            return [=](DCCallVM* vm) {
                double result = dcCallDouble(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "char")) {
            return [=](DCCallVM* vm) {
                char result = dcCallChar(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "byte")) {
            return [=](DCCallVM* vm) {
                uint8_t result = dcCallUInt8(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "uchar")) {
            return [=](DCCallVM* vm) {
                unsigned char result = dcCallUChar(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "short")) {
            return [=](DCCallVM* vm) {
                short result = dcCallShort(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "ushort")) {
            return [=](DCCallVM* vm) {
                unsigned short result = dcCallUShort(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "int")) {
            return [=](DCCallVM* vm) {
                int result = dcCallInt(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "uint")) {
            return [=](DCCallVM* vm) {
                unsigned int result = dcCallUInt(vm, funcPtr);
                return Nan::New(result);
            };
        }
        if (!strcmp(typeName, "long")) {
            return [=](DCCallVM* vm) {
                long result = dcCallLong(vm, funcPtr);
                return Nan::New((double)result);
            };
        }
        if (!strcmp(typeName, "ulong")) {
            return [=](DCCallVM* vm) {
                unsigned long result = dcCallULong(vm, funcPtr);
                return Nan::New((double)result);
            };
        }
        // TODO: proper 64 bit support, like node-ffi
        if (!strcmp(typeName, "longlong")) {
            return [=](DCCallVM* vm) {
                long long result = dcCallLongLong(vm, funcPtr);
                return Nan::New((double)result);
            };
        }
        // TODO: proper 64 bit support, like node-ffi
        if (!strcmp(typeName, "ulonglong")) {
            return [=](DCCallVM* vm) {
                unsigned long long result = dcCallULongLong(vm, funcPtr);
                return Nan::New((double)result);
            };
        }
        if (!strcmp(typeName, "bool")) {
            return [=](DCCallVM* vm) {
                bool result = dcCallBool(vm, funcPtr) != 0;
                return Nan::New(result);
            };
        }
        // TODO: proper 64 bit support, like node-ffi
        if (!strcmp(typeName, "size_t")) {
            return [=](DCCallVM* vm) {
                size_t result = dcCallSizeT(vm, funcPtr);
                return Nan::New((double)result);
            };
        }
    }
    throw logic_error("Invalid resultType.");
}
