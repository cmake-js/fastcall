file(GLOB SRC *.h* *.c*)

add_library(testlib SHARED ${SRC})

set_target_properties(
  testlib
  PROPERTIES
  COTIRE_ADD_UNITY_BUILD FALSE
  COTIRE_CXX_PREFIX_HEADER_INIT "${CMAKE_SOURCE_DIR}/src/deps.h")

cotire(testlib CONFIGURATIONS Debug RelWithDebInfo)