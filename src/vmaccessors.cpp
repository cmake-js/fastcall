#include "vmaccessors.h"
#include "deps.h"
#include "helpers.h"

using namespace v8;
using namespace node;
using namespace std;
using namespace fastcall;

namespace {
void* GetPointerAt(const Nan::FunctionCallbackInfo<v8::Value>& info, const unsigned index)
{
    return nullptr;
}
}

TVMInitialzer fastcall::MakeVMInitializer(const v8::Local<Object>& self)
{
    Nan::HandleScope scope;

    auto current = [=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {};
    auto args = Nan::Get(self, Nan::New("args").ToLocalChecked()).ToLocalChecked().As<Array>();
    for (unsigned i = 0, len = args->Length(); i < len; i++) {
        TVMInitialzer prev(current);
        auto arg = args->Get(i).As<Object>();
        auto type = GetValue<Object>(arg, "type");
        auto typeName = *Nan::Utf8String(GetValue<String>(type, "name"));
        auto indirection = GetValue(type, "indirection")->Uint32Value().ToLocalChecked();
        if (indirection > 1) {
            // pointer:
            current = [=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                prev(vm, info);
                dcArgPointer(vm, GetPointerAt(info, i));
            };
            continue;
        }
        else if (indirection == 1) {
            if (!strcmp(typeName, "int8")) {
                current = [=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    prev(vm, info);
                    dcArgChar(vm, GetInt8At(info, i));
                };
                continue;
            }
            if (!strcmp(typeName, "uint8")) {
                current = [=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    prev(vm, info);
                    dcArgChar(vm, GetUInt8At(info, i));
                };
                continue;
            }
            if (!strcmp(typeName, "int16")) {
                current = [=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    prev(vm, info);
                    dcArgInt16(vm, GetInt16At(info, i));
                };
                continue;
            }
            if (!strcmp(typeName, "uint16")) {
                current = [=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    prev(vm, info);
                    dcArgInt16(vm, GetUInt16At(info, i));
                };
                continue;
            }
            if (!strcmp(typeName, "int32")) {
                current = [=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    prev(vm, info);
                    dcArgInt32(vm, GetInt32At(info, i));
                };
                continue;
            }
            if (!strcmp(typeName, "uint32")) {
                current = [=](DCCallVM* vm, const Nan::FunctionCallbackInfo<v8::Value>& info) {
                    prev(vm, info);
                    dcArgInt32(vm, GetUInt32At(info, i));
                };
                continue;
            }

            /*types.void
            The void type.

            types.int64
            The int64 type.

            types.uint64
            The uint64 type.

            types.float
            The float type.

            types.double
            The double type.

            types.Object
            The Object type. This can be used to read/write regular JS Objects into raw memory.

            types.CString
            The CString (a.k.a "string") type.

            CStrings are a kind of weird thing. We say it's sizeof(char *), and indirection level of 1, which means that we have to return a Buffer that is pointer sized, and points to a some utf8 string data, so we have to create a 2nd "in-between" buffer.

            types.bool
            The bool type.

            Wrapper type around types.uint8 that accepts/returns true or false Boolean JavaScript values.

            types.byte
            The byte type.

            types.char
            The char type.

            types.uchar
            The uchar type.

            types.short
            The short type.

            types.ushort
            The ushort type.

            types.int
            The int type.

            types.uint
            The uint type.

            types.long
            The long type.

            types.ulong
            The ulong type.

            types.longlong
            The longlong type.

            types.ulonglong
            The ulonglong type.

            types.size_t
            The size_t type.

            */
        }

        throw logic_error(string("Invalid argument type definition at: ") + to_string(i) + ".");
    }
    return current;
}
