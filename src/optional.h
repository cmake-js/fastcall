#pragma once

#if (defined __cplusplus) && (__cplusplus >= 201700L)
#include <optional>
#else
#include "optional.hpp"
#endif

#if (defined __cplusplus) && (__cplusplus >= 201700L)
#define OPTIONAL_NS std
#else
#define OPTIONAL_NS std::experimental
#endif
