'use strict';

function ArrayIndex() {
}

Object.defineProperties(ArrayIndex.prototype, {
  length: {
    get: function () {
      return this._length;
    },
    set: function (value) {
      this._length = value;
      if (this[ArrayIndex.lengthChanged]) {
        this[ArrayIndex.lengthChanged](value);
      }
    }
  }
});

ArrayIndex.prototype.toArray = function () {
  const array = [];
  for (let i = 0; i < this.length; i++) {
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
  const a = this.toArray();
  return a.toString(...arguments);
};

ArrayIndex.get = 'get';
ArrayIndex.set = 'set';
ArrayIndex.lengthChanged = '_lengthChanged';

module.exports = ArrayIndex;