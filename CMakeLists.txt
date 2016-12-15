# Copyright 2016 Gábor Mező (gabor.mezo@outlook.com)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

cmake_minimum_required(VERSION 2.8)

# Detect if production or developer mode.
# .npmignore excludes "test" directory, so:
set(prod TRUE)
set(testDir "${CMAKE_SOURCE_DIR}/test")
if(EXISTS "${testDir}" AND IS_DIRECTORY "${testDir}")
  set(prod FALSE)
endif()

# Configure CCache if available
find_program(CCACHE_FOUND ccache)
if(CCACHE_FOUND)
    set_property(GLOBAL PROPERTY RULE_LAUNCH_COMPILE ccache)
    set_property(GLOBAL PROPERTY RULE_LAUNCH_LINK ccache)
    message(STATUS "Using ccache.")
endif()

add_subdirectory(deps/dyncall)
set (CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/deps/dyncall/dyncall")
include(DynCallConfig)
set (CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/deps/dyncall/dyncallback")
include(DynCallbackConfig)
set (CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/deps/dyncall/dynload")
include(DynLoadConfig)

project (fastcall CXX)

include_directories(
    ${DYNCALL_INCLUDE_DIRS}
    ${DYNCALLBACK_INCLUDE_DIRS}
    ${DYNLOAD_INCLUDE_DIRS}
    ${CMAKE_JS_INC}
    "${CMAKE_SOURCE_DIR}/deps/optional"
    "${CMAKE_SOURCE_DIR}/src")

set_property(GLOBAL PROPERTY USE_FOLDERS ON)

add_definitions(-DSOURCE_DIR="${CMAKE_SOURCE_DIR}")

if(WIN32)
  add_definitions(-DNOMINMAX)
  if(MSVC)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /EHa")
  elseif(CMAKE_COMPILER_IS_GNUCXX)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=native")
    set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -DNDEBUG -DBOOST_DISABLE_ASSERTS -Ofast -ffast-math -funroll-loops")
  else()
    message(SEND_ERROR "You are using an unsupported Windows compiler! (Not MSVC or GCC)")
  endif()
elseif(UNIX)
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -march=native")
  set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -DNDEBUG -DBOOST_DISABLE_ASSERTS -Ofast -ffast-math -funroll-loops")
else()
  message(SEND_ERROR "You are on an unsupported platform! (Not Win32 or Unix)")
endif()

if(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Qunused-arguments")
    message(STATUS "Clang configured.")
endif()

add_subdirectory(deps/ref-cmake)
add_subdirectory(src)

if (NOT prod)
    message(STATUS "Developer mode modules added to build configuration.")
    add_subdirectory(test/testlib)
    add_subdirectory(benchmarks/benchlib)
    add_subdirectory(benchmarks/benchmod)
endif()
