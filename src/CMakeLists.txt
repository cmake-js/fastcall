file(GLOB SRC *.h* *.c*)

add_library(${PROJECT_NAME} SHARED ${SRC})

target_link_libraries (${PROJECT_NAME}
  ${CMAKE_JS_LIB}
  ${DYNCALL_LIBRARIES}
  ${DYNCALLBACK_LIBRARIES}
  ${DYNLOAD_LIBRARIES})

set_target_properties(
  ${PROJECT_NAME}
  PROPERTIES
  PREFIX "" 
  SUFFIX ".node")
