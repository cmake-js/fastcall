
/**
 * Module dependencies.
 */

var ref = require('./ref')
var assert = require('assert')
var debug = require('debug')('ref-union')

/**
 * Module exports.
 */

module.exports = Union

/**
 * The "Union" type constructor.
 */

function Union () {
  debug('defining new union "type"')

  function UnionType (arg, data) {
    if (!(this instanceof UnionType)) {
      return new UnionType(arg, data)
    }
    debug('creating new union instance')
    var store
    if (Buffer.isBuffer(arg)) {
      debug('using passed-in Buffer instance to back the union', arg)
      assert(arg.length >= UnionType.size, 'Buffer instance must be at least '
          + UnionType.size + ' bytes to back this untion type')
      store = arg
      arg = data
    } else {
      debug('creating new Buffer instance to back the union (size: %d)', UnionType.size)
      store = new Buffer(UnionType.size)
    }

    // set the backing Buffer store
    store.type = UnionType
    this['ref.buffer'] = store

    // initialise the union with values supplied
    if (arg) {
      //TODO: Sanity check - e.g. (Object.keys(arg).length == 1)
      for (var key in arg) {
        // hopefully hit the union setters
        this[key] = arg[key]
      }
    }
    UnionType._instanceCreated = true
  }

  // make instances inherit from `proto`
  UnionType.prototype = Object.create(proto, {
    constructor: {
        value: UnionType
      , enumerable: false
      , writable: true
      , configurable: true
    }
  })

  UnionType.defineProperty = defineProperty
  UnionType.toString = toString
  UnionType.fields = {}

  // comply with ref's "type" interface
  UnionType.size = 0
  UnionType.alignment = 0
  UnionType.indirection = 1
  UnionType.get = get
  UnionType.set = set

  // Read the fields list
  var arg = arguments[0]
  if (typeof arg === 'object') {
    Object.keys(arg).forEach(function (name) {
      var type = arg[name];
      UnionType.defineProperty(name, type);
    })
  }

  return UnionType
}

function get (buffer, offset) {
  debug('Union "type" getter for buffer at offset', buffer, offset)
  if (offset > 0) {
    buffer = buffer.slice(offset)
  }
  return new this(buffer)
}

function set (buffer, offset, value) {
  debug('Union "type" setter for buffer at offset', buffer, offset, value)
  if (offset > 0) {
    buffer = buffer.slice(offset)
  }
  var union = new this(buffer)
  var isUnion = value instanceof this
  if (isUnion) {
    // TODO: optimize - use Buffer#copy()
    Object.keys(this.fields).forEach(function (name) {
      // hopefully hit the setters
      union[name] = value[name]
    })
  } else {
    for (var name in value) {
      // hopefully hit the setters
      union[name] = value[name]
    }
  }
}

function toString () {
  return '[UnionType]'
}

/**
 * Adds a new field to the union instance with the given name and type.
 * Note that this function will throw an Error if any instances of the union
 * type have already been created, therefore this function must be called at the
 * beginning, before any instances are created.
 */

function defineProperty (name, type) {
  debug('defining new union type field', name)

  // allow string types for convenience
  type = ref.coerceType(type)

  assert(!this._instanceCreated, 'an instance of this Union type has already '
      + 'been created, cannot add new data members anymore')
  assert.equal('string', typeof name, 'expected a "string" field name')
  assert(type && /object|function/i.test(typeof type) && 'size' in type &&
      'indirection' in type
      , 'expected a "type" object describing the field type: "' + type + '"')
  assert(!(name in this.prototype), 'the field "' + name
      + '" already exists in this Union type')

  // define the getter/setter property
  var desc = {
      enumerable: true
    , configurable: true
    , get: get
    , set: set
  };
  Object.defineProperty(this.prototype, name, desc);

  var field = {
    type: type
  }
  this.fields[name] = field
  var cacheName = '_cache' + name

  // calculate the new size and alignment
  recalc(this);

  function get () {
    if (this[cacheName]) {
      return this[cacheName]
    }
    debug('getting "%s" union field (length: %d)', name, type.size)
    var got = ref.get(this['ref.buffer'], 0, type)
    if (typeof got === 'object') {
      this[cacheName] = got;
    }
    return got;
  }

  function set (value) {
    this[cacheName] = null
    debug('setting "%s" union field (length: %d)', name, type.size, value)
    return ref.set(this['ref.buffer'], 0, value, type)
  }
}

function recalc (union) {
  // reset size and alignment
  union.size = 0
  union.alignment = 0

  var fieldNames = Object.keys(union.fields)

  // loop through to set the size of the union of the largest member field
  // and the alignment to the requirements of the largest member
  fieldNames.forEach(function (name) {
    var field = union.fields[name]
    var type = field.type

    var size = type.indirection === 1 ? type.size : ref.sizeof.pointer
    var alignment = type.alignment || ref.alignof.pointer
    if (type.indirection > 1) {
      alignment = ref.alignof.pointer
    }
    union.alignment = Math.max(union.alignment, alignment)
    union.size = Math.max(union.size, size)
  })

  // any padding
  var left = union.size % union.alignment
  if (left > 0) {
    debug('additional padding to the end of union:', union.alignment - left)
    union.size += union.alignment - left
  }
}



/**
 * the base prototype that union type instances will inherit from.
 */

var proto = {}

proto['ref.buffer'] = ref.NULL

/**
 * returns a Buffer pointing to this union data structure.
 */

proto.ref = function ref () {
  return this['ref.buffer']
}
