file(GLOB SRC ../ref/src/*.h* ../ref/src/*.c*)

add_library(ref SHARED ${SRC})

target_link_libraries (ref ${CMAKE_JS_LIB})

set_target_properties(
  ref
  PROPERTIES
  PREFIX "" 
  SUFFIX ".node")
