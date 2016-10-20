file(GLOB SRC *.h* *.c* ../benchlib/functions.cpp)

include_directories(../benchlib)

add_library(benchmod SHARED ${SRC})

target_link_libraries (benchmod
  ${CMAKE_JS_LIB}
  ${DYNCALL_LIBRARIES}
  ${DYNCALLBACK_LIBRARIES}
  ${DYNLOAD_LIBRARIES})

set_target_properties(
  benchmod
  PROPERTIES
  PREFIX "" 
  SUFFIX ".node")
