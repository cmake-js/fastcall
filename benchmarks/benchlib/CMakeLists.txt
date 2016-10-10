file(GLOB SRC *.h* *.c*)

add_library(benchlib SHARED ${SRC})
