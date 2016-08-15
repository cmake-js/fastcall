cmake_minimum_required(VERSION 2.8)

# Configure CCache if available
find_program(CCACHE_FOUND ccache)
if(CCACHE_FOUND)
    set_property(GLOBAL PROPERTY RULE_LAUNCH_COMPILE ccache)
    set_property(GLOBAL PROPERTY RULE_LAUNCH_LINK ccache)
    message(STATUS "Using ccache.")
endif(CCACHE_FOUND)

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
    ${CMAKE_JS_INC})

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

add_subdirectory(src)
add_subdirectory(test/testlib)
