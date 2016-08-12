file(GLOB SRC *.h* *.c*)

add_library(testlib SHARED ${SRC})
