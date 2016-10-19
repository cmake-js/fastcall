file(GLOB SRC ../ref/src/*.h* ../ref/src/*.c*)

add_library(binding SHARED ${SRC})

target_link_libraries (binding ${CMAKE_JS_LIB})

set_target_properties(
  binding
  PROPERTIES
  PREFIX "" 
  SUFFIX ".node")
