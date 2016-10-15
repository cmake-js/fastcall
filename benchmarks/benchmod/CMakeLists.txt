file(GLOB SRC *.h* *.c*)

include_directories(../benchlib)

add_library(benchmod SHARED ${SRC})

target_link_libraries (benchmod
  ${CMAKE_JS_LIB}
  ${DYNCALL_LIBRARIES}
  ${DYNCALLBACK_LIBRARIES}
  ${DYNLOAD_LIBRARIES}
  benchlib)

set_target_properties(
  benchmod
  PROPERTIES
  PREFIX "" 
  SUFFIX ".node")
