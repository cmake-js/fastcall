'use strict';

function ArrayIndex() {
  this._length = 0;
}

Object.defineProperties(ArrayIndex.prototype, {
  length: {
    get: function get() {
      return this._length;
    },
    set: function set(value) {
      this._length = value;
      if (this[ArrayIndex.lengthChanged]) {
        this[ArrayIndex.lengthChanged](value);
      }
    }
  }
});

ArrayIndex.prototype.toArray = function () {
  var array = [];
  for (var i = 0; i < this.length; i++) {
    array[i] = this.get(i);
  }
  return array;
};

ArrayIndex.prototype.toJSON = function () {
  return this.toArray();
};

ArrayIndex.prototype.inspect = function () {
  return this.toArray();
};

ArrayIndex.prototype.toString = function () {
  var a = this.toArray();
  return a.toString.apply(a, arguments);
};

ArrayIndex.get = 'get';
ArrayIndex.set = 'set';
ArrayIndex.lengthChanged = '_lengthChanged';

module.exports = ArrayIndex;
//# sourceMappingURL=ArrayIndex.js.map