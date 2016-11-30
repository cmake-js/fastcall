# fastcall

fastcall - Fast, dyncall based foreign function interface library for Node.js.

# Why?

Because writing native modules is an annoying work with an underdocumented, 
hard to debug C++ API that no one ever wants to touch. :)

Writing native module is about wrapping a native library's C API 
to JavaScript in almost all cases. However shared libraries and their methods could
get loaded under a process' address space dynamically, and that dynamic binding
could get implemented in pure JavaScript. So, there is no need to write native modules 
for that purpose if we have something like that stuff.

There is an excellent and popular dynamic binding library for Node.js:
[node-ffi](https://github.com/node-ffi/node-ffi). Then why we need another one could ask?
For performance! There is a good 100x-1000x
method call performance overhead when using [node-ffi](https://github.com/node-ffi/node-ffi)
compared to hand made C++ native module, which is unaccetable in most cases.

# About

**fastcall** is a JavaScript foreign function interface library. It's designed with 
performance and simplicity in mind, an it has comparable method call overhead with hand 
made C++ native modules. See the [benchmarks](#becnhmarks).

## Features

- uses [CMake.js](https://github.com/cmake-js/cmake-js) as of its build system 
(has no Python 2 dependency)
- based on TooTallNate's popular [ref](http://tootallnate.github.io/ref/) module
- has an almost 100% [node-ffi](https://github.com/node-ffi/node-ffi) compatible interface,
could work as a drop-in replacement of [node-ffi](https://github.com/node-ffi/node-ffi)
- RAII scopes for JavaScript

## Requirements

- [CMake](http://www.cmake.org/download/)
- A proper C/C++ compiler toolchain of the given platform
    - **Windows**:
        - [Visual C++ Build Tools](http://landinghub.visualstudio.com/visual-cpp-build-tools)
        or a recent version of Visual C++ will do ([the free Community](https://www.visualstudio.com/products/visual-studio-community-vs) version works well)             
    - **Unix/Posix**:
        - Clang or GCC
        - Ninja or Make (Ninja will be picked if both present)

## Install

```bash
npm install --save fastcall
```

# <a name='benchmarks'></a>Benchmarks

*TODO*

# Documentation and Tutorial
## RAII scopes
## ref
### ArrayType
### StructType
### UnionType
## Functions
### sync
### async
## node-ffi compatible interface
