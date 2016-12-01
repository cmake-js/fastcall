# fastcall

*TOC*

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

When there is no alive references exist for your objects, they gets disposed automatically once Node.js' GC cycle kicks in. There is nothing else to do there. :) (Reporting approximate memory usage would help in this case, though.)

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

If a scope's function returns a Promise (any then-able object will do) then it turns to an asynchronous scope, it also returns a Promise. Same rules apply like synchronous scopes.

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

## ref

### ArrayType

### StructType

### UnionType

## Functions

### sync

### async

## node-ffi compatible interface
