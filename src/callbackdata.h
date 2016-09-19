#pragma once
#include <nan.h>
#include "defs.h"

namespace fastcall {
struct CallbackData {
    CallbackData(Nan::Callback* nanCallback);
    ~CallbackData();

    Nan::Callback* GetNanCallback() const;
    unsigned GetCallMode() const;
    void SetCallMode(unsigned callMode);
private:
    Nan::Callback* nanCallback = nullptr;
    unsigned callMode;
};

CallbackData::CallbackData(Nan::Callback* nanCallback)
    : nanCallback(nanCallback)
{
}

CallbackData::~CallbackData()
{
    delete nanCallback;
}

inline Nan::Callback* CallbackData::GetNanCallback() const
{
    return nanCallback;
}

unsigned CallbackData::GetCallMode() const
{
    return callMode;
}

void CallbackData::SetCallMode(unsigned callMode)
{
    assert(callMode == SYNC_CALL_MODE || callMode == ASYNC_CALL_MODE);
    this->callMode = callMode;
}

}
