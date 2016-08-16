#include "vmaccessors.h"
#include "deps.h"
#include "helpers.h"

#define dcArgInt8 dcArgChar
#define dcArgUInt8(vm, p) { auto tmp = p; dcArgChar(vm, reinterpret_cast<char&>(tmp)); }

#define dcArgInt16 dcArgShort
#define dcArgUInt16(vm, p) { auto tmp = p; dcArgShort(vm, reinterpret_cast<short&>(tmp)); }

#define dcArgInt32 dcArgInt
#define dcArgUInt32(vm, p) { auto tmp = p; dcArgInt(vm, reinterpret_cast<int&>(tmp)); }

#define dcArgInt64 dcArgLongLong
#define dcArgUInt64(vm, p) { auto tmp = p; dcArgLongLong(vm, reinterpret_cast<long long&>(tmp)); }

#define dcArgByte dcArgChar

#define dcArgUChar(vm, p) { auto tmp = p; dcArgChar(vm, reinterpret_cast<char&>(tmp)); }

#define dcArgUShort(vm, p) { auto tmp = p; dcArgShort(vm, reinterpret_cast<short&>(tmp)); }

#define dcArgUInt(vm, p) { auto tmp = p; dcArgInt(vm, reinterpret_cast<int&>(tmp)); }

#define dcArgULong(vm, p) { auto tmp = p; dcArgLong(vm, reinterpret_cast<long&>(tmp)); }

#define dcArgULongLong(vm, p) { auto tmp = p; dcArgLongLong(vm, reinterpret_cast<long long&>(tmp)); }

#define dcArgSizeT(vm, p) { auto tmp = p; dcArgLongLong(vm, reinterpret_cast<long long&>(tmp)); }

#define dcArgUChar(vm, p) { auto tmp = p; dcArgChar(vm, reinterpret_cast<char&>(tmp)); }

#define dcArgBool(vm, p) { auto tmp = p; dcArgChar(vm, reinterpret_cast<char&>(tmp)); }

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

namespace {
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
    Nan::HandleScope scope;

    return static_cast<int8_t>(info[index]->Int32Value());
}

inline uint8_t GetUInt8At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    Nan::HandleScope scope;

    return static_cast<uint8_t>(info[index]->Uint32Value());
}

inline int16_t GetInt16At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    Nan::HandleScope scope;

    return static_cast<int16_t>(info[index]->Int32Value());
}

inline uint16_t GetUInt16At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    Nan::HandleScope scope;

    return static_cast<uint16_t>(info[index]->Uint32Value());
}

inline int32_t GetInt32At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    Nan::HandleScope scope;

    return static_cast<int32_t>(info[index]->Int32Value());
}

inline uint32_t GetUInt32At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    Nan::HandleScope scope;

    return static_cast<uint32_t>(info[index]->Uint32Value());
}

// TODO: proper 64 bit support, like node-ffi
inline int64_t GetInt64At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    Nan::HandleScope scope;

    return static_cast<int64_t>(info[index]->Int32Value());
}

// TODO: proper 64 bit support, like node-ffi
inline uint64_t GetUInt64At(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    Nan::HandleScope scope;

    return static_cast<uint64_t>(info[index]->Uint32Value());
}

inline float GetFloatAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    Nan::HandleScope scope;

    return static_cast<float>(info[index]->NumberValue());
}

inline double GetDoubleAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    Nan::HandleScope scope;

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
}

TVMInitialzer fastcall::MakeVMInitializer(const v8::Local<Object>& self)
{
    Nan::HandleScope scope;

    std::vector<TVMInitialzer> list;

    auto args = Nan::Get(self, Nan::New("args").ToLocalChecked()).ToLocalChecked().As<Array>();
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
            if (!strcmp(typeName, "longlong")) {
                list.emplace_back([=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    dcArgLongLong(vm, GetLongLongAt(info, i));
                });
                continue;
            }
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
