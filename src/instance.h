#pragma once

namespace fastcall {
struct Instance {
protected:
    Instance() = default;
    virtual ~Instance() = default;
    Instance(const Instance&) = delete;
    Instance& operator=(const Instance&) = delete;
};
}
