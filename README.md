# TOC

<!-- TOC -->

- [TOC](#toc)
- [Why?](#why)
- [About](#about)
    - [Features](#features)
    - [Requirements](#requirements)
    - [Install](#install)
- [Benchmarks](#benchmarks)
- [Documentation and Tutorials](#documentation-and-tutorials)
    - [RAII](#raii)
        - [Disposable](#disposable)
        - [automatic cleanup (GC)](#automatic-cleanup-gc)
        - [scopes](#scopes)
    - [fastcall.Library](#fastcalllibrary)
        - [ref](#ref)
        - [declaring functions](#declaring-functions)
        - [declaring structs](#declaring-structs)
        - [declaring unions](#declaring-unions)
        - [declaring arrays](#declaring-arrays)
        - [declaring anything :)](#declaring-anything-)
    - [node-ffi compatible interface](#node-ffi-compatible-interface)

<!-- /TOC -->

# Why?

Because writing native modules is an annoying work with an under-documented, hard to debug C++ API that no one ever wants to touch. :)

Writing native module is about wrapping a native library's C API to JavaScript in almost all cases. However shared libraries and their methods could get loaded under a process' address space dynamically, and that dynamic binding could get implemented in pure JavaScript. So, there is no need to write native modules for that purpose if we have something like that stuff.

There is an excellent and popular dynamic binding library for Node.js:
[node-ffi](https://github.com/node-ffi/node-ffi). Then why we need another one could ask? For performance! There is a good 100x-1000x
method call performance overhead when using [node-ffi](https://github.com/node-ffi/node-ffi) compared to hand made C++ native module, which is unacceptable in most cases.

# About

**fastcall** is a JavaScript foreign function interface library. It's designed with performance and simplicity in mind, an it has comparable method call overhead with hand made C++ native modules. See the [benchmarks](#benchmarks).

## Features

- uses [CMake.js](https://github.com/cmake-js/cmake-js) as of its build system (has no Python 2 dependency)
- based on TooTallNate's popular [ref](http://tootallnate.github.io/ref/) module
- has an almost 100% [node-ffi](https://github.com/node-ffi/node-ffi) compatible interface, could work as a drop-in replacement of [node-ffi](https://github.com/node-ffi/node-ffi)
- RAII: supports deterministic scopes and automatic GC cleanup

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

# Benchmarks

*TODO*

# Documentation and Tutorials

## RAII
Native resources must get freed somehow. We can rely on Node.js' garbage collector for this task, but that would only work if our native code's held resources are memory blocks. For other resources it is more appropriate to free them manually, for example in try ... finally blocks. However there are more complex cases.

Let's say we have a math library that works on the GPU with vectors and matrices. A complex formula will create a bunch of temporary vectors and matrices, that will hold a lot memory on the GPU. In this case, we cannot rely on garbage collector of course because that knows nothing about VRAM. Decorating our formula with try ... finally blocks would be a horrible idea in this complex case, just think about it:

```js
const vec1 = [1, 2, 3];
const vec2 = [4, 5, 6];
const result = lib.pow(lib.mul(vec1, vec2), lib.abs(lib.add(vec1, vec2)));

// would be something like:

const vec1 = [1, 2, 3];
const vec2 = [4, 5, 6];
let tmpAdd = null, tmpAbs = null, tmpMul = null;
let result;
try {
	tmpAdd = lib.add(vec1, vec2);
	tmpAbs = lib.abs(tmpAdd);
	tmpMul = lib.mul(vec1, vec2);
	result = lib.pow(tmpMul, tmpAbs);
}
finally {
	tmpAdd && tmpAdd.free();
	tmpMul && tmpMul.free();
	tmpAbs && tmpAbs.free();
}
```
So we need an automatic, deterministic scoping mechanism for JavaScript for supporting this case. Like C++ RAII or Python's `__del__` method.

The good news is all three mentioned techniques are supported in **fastcall**.

### Disposable

For accessing **fastcall**'s RAII features you need a class that inherits from `Disposable`. It's a very simple class:

```js
class Disposable {
	constructor(disposeMethod, aproxAllocatedMemory);
	dispose();
}
```

- `disposeMethod`: could be null or a function. If null, then `Disposable` does nothing. A function should release your object's native resources. Please note that this dispose method has no parameters, and only allowed to capture native handles from the source object, not a reference of the source itself because that would prevent garbage collection!
- `dispose()`: will invoke `disposeMethod` manually (for the mentioned try ... catch use cases). Subsequent calls does nothing. You can override this method for implementing custom disposing logic, just don't forget to call its prototype's dispose() if your class have native references.
- `aproxAllocatedMemory`: in bytes. You could inform Node.js' GC about your native object's memory usage (calls [Nan::AdjustExternalMemory()](https://github.com/nodejs/nan/blob/master/doc/v8_internals.md#api_nan_adjust_external_memory)). Will be considered only if it's a positive number.

Example:

```js
const lib = require('lib');
const fastcall = require('fastcall');
const Disposable = fastcall.Disposable;

class Stuff {
	constructor() {
		const handle = lib.createStuff();
		super(
			() => {
				// you should NEVER mention "this" there
				// that would prevent garbage collection
				lib.releaseStuff(handle);
			},
			42 /*Bytes*/);
		this.handle = handle;
	}
}

// later

let stuff = null;
try {
	stuff = new Stuff();
	// do stuff :)
}
finally {
	stuff && stuff.dispose();
}
```
For prototype based inheritance please use `Disposable.Legacy` as the base class:

```js
function Stuff() {
	Disposable.Legacy.call(this, ...);
}

util.inherits(Stuff, Disposable.Legacy);
```

### automatic cleanup (GC)

When there is no alive references exist for your objects, they gets disposed automatically once Node.js' GC cycle kicks in (`lib.releaseStuff(handle)` would get called from the above example). There is nothing else to do there. :) (Reporting approximate memory usage would help in this case, though.)

### scopes

For deterministic destruction without that try ... catch mess, **fastcall** offers scopes. Let's take a look at an example:

```js
const scope = require('fastcall').scope;

// Let's say, we have Stuff class 
// from the previous example.

scope(() => {
	const stuff1 = new Stuff();
	// do stuff :)
	return scope(() => {
		const stuff2 = new Stuff();
		const stuff3 = new Stuff();
		const stuff4 = fuseStuffs(/*tmp*/fuseStuff(stuff1, stuff2), stuff3);
		return stuff4;
	});
});
```

Kinda C++ braces.

**Rules:**

- scope only affects objects whose classes inherits from `Disposable`, we refer them as *disposables*
- scope will affect implicitly created disposables also (like that hidden temporary result of the inner `fuseStuff` call of the above example) 
- all disposables gets disposed on the end of the scope, except returned ones
- returned disposables are propagated to parent scope, if there is one - if there isn't a parent, they escape (see below) 

**Escaping and compound disposables:**

A disposable could escape from a nest of scopes at anytime. This will be handy for creating classes those are a compound of other disposables. Escaped disposable would become a free object that won't get affected further by the above rules. (They would get disposed manually or by the garbage collector eventually.)

```js
class MyClass extends Disposable {
	constructor() {
		// MyClass is disposable but has no
		// direct native references,
		// so its disposeMethod is null
		super(null);
		
		this.stuff1 = null;
		this.stuff2 = null;
		scope(() => {
			const stuff1 = new Stuff();
			// do stuff :)
			this.stuff1 = scope.escape(stuff1);
			const tmp = new Stuff();
			this.stuff2 = scope.escape(fuseStuffs(tmp, stuff1));
		});
		// at this point this.stuff1 and 
		// this.stuff2 will be alive
		// despite their creator scope got ended
	}
	
	dispose() {
		// we should override dispose() to
		// free our custom objects
		this.stuff1.dispose();
		this.stuff2.dispose();
	}
}

// later

scope(() => {
	const poo = new MyClass();
	// so this will open a child scope in
	// MyClass' constructor that frees its 
	// temporaries automatically.
	// MyClass.stuff1 and MyClass.stuff2 escaped,
	// so they has nothing to do with the current scope.
});
// However poo got created in the above scope, 
// so it gets disposed at the end, and MyClass.stuff1 and MyClass.stuff2 gets disposed at that point because of the overridden dispose().
```

**Result:**

`scope`'s result is the result of its function.

```js
const result = scope(() => {
	return new Stuff();
});
// result is the new Stuff
```
Rules of propagation is described above. Propagation also happens when the function exists by:

- an array of disposables
- a plain objects holding disposables in its values
- Map of disposables
- Set of disposables

This lookup is **recursive**, and apply for `scope.escape()`'s argument, so you can escape and array of Map of disposables for example with one call.

**Async:**

If a scope's function returns a Promise (any then-able object will do) then it turns to an asynchronous scope, it also returns a Promise. Same rules apply like with synchronous scopes.

```js
const result = scope(() => 
	lib.loadAsync()
	.then(loaded => {
		// do something with loaded ...
		return new Stuff();
	}));

result.then(result => {
	// result is the new Stuff
});
```

**Coroutines**:

Coroutines supported by calling `scope.async`. So the above example turns to:

```js
const result = yield scope.async(function* () {
	const loaded = lib.loadAsync();
	return new Stuff();
})
```

Way much nicer, eh? It does exactly the same thing.

## fastcall.Library

Central part of **fastcall** is the `Library`. That's where you can load shared libraries to Node.js' address spaces, and there you could access its functions and declared types.

```js
class Library {
	constructor(libPath, options);

	release();

	declare(); declareSync(); declareAsync();
	
	function(); syncFunction(); asyncFunction();
	
	struct();

	union();

	array();

	callback();
	
	get functions();
	
	get structs();
	
	get unions();
	
	get arrays();
	
	get callbacks();
	
	get interface();
}
```

**Constructor:**

- `libPath`: path of the shared library to load. There is no magical platform dependent extension guess system, you should provide the correct library paths on each supported platforms (`os` module would help). For example, for OpenCL, you gotta pass `OpenCL.dll` on Windows, and `libOpenCL.so` on Linux, and so on.
- `options`: optional object with optional properties of:
	- `options.defaultCallMode`: either `Library.callMode.sync`, which means synchronous functions will get created, or `Library.callMode.async` which means asynchronous functions will get created by default
	- `options.syncMode`: either `Library.syncMode.lock`, which means asynchronous function invocations will get serialized with a thread locks, or `Library.syncMode.queue` which means asynchronous function invocations will get serialized with a queue (more on that later)

**Methods:**

- `release`: release loaded shared library's resources (please note that `Library` is not a `Disposable` because you'll need to call this method in very rare situations)
- `declare`: parses and process a declaration string. Its methods are declared with the default call mode
- `declareSync`: parses and process a declaration string. Its methods are declared as synchronous
- `declareAsync`: parses and process a declaration string. Its methods are declared as asynchronous
- `function`: declares a function with the default call mode
- `syncFunction`: declares a synchronous function
- `asyncFunction`: declares an asynchronous function
- `struct`: declares a structure
- `union`: declares an union
- `array`: declares an array
- `callback`: declares a callback

**Properties:**

- `functions`: declared functions (metadata)
- `structs`: declared structures (metadata)
- `unions`: declared unions (metadata)
- `arrays`: declared arrays (metadata)
- `callbacks`: declared callbacks (metadata)

### ref

Let's take a look at [ref](http://tootallnate.github.io/ref/) before going into the details (credits for [TooTallNate](https://github.com/TooTallNate)). **ref** is a native type system with pointers and other types those are required to address C based interfaces of native shared libraries. It also has a native interface compatible types for [structs](https://github.com/TooTallNate/ref-struct), [unions](https://github.com/TooTallNate/ref-union) and [arrays](https://github.com/TooTallNate/ref-array).

In **fastcall** there is a **bundled versions** of [ref](https://github.com/TooTallNate/ref), [ref-array](https://github.com/TooTallNate/ref-array), [ref-struct](https://github.com/TooTallNate/ref-struct) and [ref-union](https://github.com/TooTallNate/ref-union). Those are 100% compatible with the originals, they are there because I didn't wanted to have a [CMake.js](https://github.com/cmake-js/cmake-js) based module to depend on anything node-gyp based stuff. Bundled versions are built with [CMake.js](https://github.com/cmake-js/cmake-js). The only exception is [ref-array](https://github.com/TooTallNate/ref-array), **fastcall**'s version contains some interface breaking changes for the sake of a way much better performance.

```js
const fastcall = require('fastcall');

// 100% ref@latest built with CMake.js:
const ref = fastcall.ref;

// 100% ref-struct@latest
const StructType = fastcall.StructType;

// 100% ref-union@latest
const UnionType = fastcall.UnionType;

// modified ref-struct@latest
const ArrayType = fastcall.ArrayType;
```

**ref-array changes**:

See the original FAQ there: https://github.com/TooTallNate/ref-array

There is two huge performance bottleneck exists in this module. The first is the price of array indexer syntax:

```js
const IntArray = new ArrayType('int');
const arr = new IntArray(5);
arr[1] = 1;
arr[0] = arr[1] + 1;
```

Those [0] and [1] are implemented by defining Object properties named "0" and "1" respectively. For supporting a length of 100, there will be 100 properties created on the fly. On the other hand those indexing numbers gets converted to string on each access.

Because of that, **fastcall**s version uses `get` and `set` method for indexing:

```js
const IntArray = new ArrayType('int');
const arr = new IntArray(5);
arr.set(1, 1);
arr.set(0, arr.get(1) + 1);
```
Not that nice, but way much faster than the original. 

The other is the continous reinterpretation of a dynamically sized array.

```js
const IntArray = new ArrayType('int');
const outArr = ref.refType(IntArray);
const outLen = ref.refType('uint');

myLib.getIntegers(outArr, outLen);
const arr = outArr.unref();
const len = outLen.unref();
// arr is an IntArray with length of 0
// but we know that after the pointer
// there are a len number of element elements,
// so we can do:

for (let i = 0; i < len; i++) {
	console.log(arr[i]);
}
```

So far so good, but in each iteration `arr` will gets [reinterpreted](http://tootallnate.github.io/ref/#exports-reinterpret) to a new Buffer with a size that would provide access to an item of index `i`. That's slow.

In **fastcall**'s version array's length is writable, so you can do:

```js
arr.length = len;
for (let i = 0; i < len; i++) {
	console.log(arr.get(i));
}
```
Which means only one reinterpret, and this is a lot of faster than the original.

Unfortunately those are huge interface changes, that's why it might not make it in a PR.

### declaring functions

The interface uses [ref and co.](#ref) for its ABI.

For declaring functions, you can go with a [node-ffi](https://github.com/node-ffi/node-ffi/wiki/Node-FFI-Tutorial) like syntax, or with a C like syntax.

Examples:

```js
const fastcall = require('fastcall');
const Library = fastcall.Library;
const ref = fastcall.ref;

const lib = new Library('bimbo.dll')
.function('int mul(int, int)') // arg. names could be omitted
.function('int add(int value1, int)')
.function('int sub(int value1, int value2)')
.function({ div: ['int', ['int', 'int']] })
.function('void foo(void* ptr, int** outIntPtr)')
.function({ poo: ['pointer', [ref.types.int, ref.refType(ref.types.float)]] });
```

Declared functions are accessible on the lib's interface:

```js
const result = lib.interface.mul(42, 42);
```

**Sync and async**:

About sync and async modes please refer for [fastcall.Library](#fastcalllibrary)'s documentation.

If a function is async, it runs in a **separate thread**, and the result is a Bluebird Promise.

```js
const lib = new Library(...)
.asyncFunction('int mul(int, int)');

lib.interface.mul(42, 42)
.then(result => console.log(result));
```

You can always switch between a function's sync and async modes: 

```js
const lib = new Library(...)
.function('int mul(int, int)');

const mulAsync = library.interface.mul.async;
const mulSync = mulAsync.sync;
assert.strictEqual(mulSync, library.interface.mul);
assert.strictEqual(mulAsync, mulSync.async.async.sync.async);
```
You get the idea.

**Concurrency and thread safety:**

By default, a library's asynchronous functions are running in parallel distributed in libuv's thread pool. So they are not thread safe.

For thread safety there are two options could be passed to [fastcall.Library](#fastcalllibrary)'s constructor: `syncMode.lock` and `syncMode.queue`.

With lock, a simple mutex will be used for synchronization. With queue, all of library's asynchronous calls are enqueued, and only one could execute at once. The former is a bit slower, but that allows synchronization between synchronous calls of the given library. However the latter will throw an exception if a synchronous function gets called while there is an asynchronous invocation is in progress.

**Metadata:**

In case of:

```js
const lib = new Library(...)
.function('int mul(int value1, int value2)');
```

`lib.functions.mul` gives the same metadata object's instance as `lib.interface.mul.function`.

**- properties:**

- `resultType`: ref type of the function's result
- `args`: is an array of argument objects, with properties of
	- `name`: name of the argument (arg[n] when the name was omitted)
	- `type`: ref type of the given argument

### declaring structs

### declaring unions

### declaring arrays

### declaring anything :)

## node-ffi compatible interface
