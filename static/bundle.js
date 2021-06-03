(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.beepBoop = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":2,"get-intrinsic":7}],2:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":6,"get-intrinsic":7}],3:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }

  // Remove event specific arrays for event types that no
  // one is subscribed for to avoid memory leak.
  if (callbacks.length === 0) {
    delete this._callbacks['$' + event];
  }

  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};

  var args = new Array(arguments.length - 1)
    , callbacks = this._callbacks['$' + event];

  for (var i = 1; i < arguments.length; i++) {
    args[i - 1] = arguments[i];
  }

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],4:[function(require,module,exports){
module.exports = stringify
stringify.default = stringify
stringify.stable = deterministicStringify
stringify.stableStringify = deterministicStringify

var arr = []
var replacerStack = []

// Regular stringify
function stringify (obj, replacer, spacer) {
  decirc(obj, '', [], undefined)
  var res
  if (replacerStack.length === 0) {
    res = JSON.stringify(obj, replacer, spacer)
  } else {
    res = JSON.stringify(obj, replaceGetterValues(replacer), spacer)
  }
  while (arr.length !== 0) {
    var part = arr.pop()
    if (part.length === 4) {
      Object.defineProperty(part[0], part[1], part[3])
    } else {
      part[0][part[1]] = part[2]
    }
  }
  return res
}
function decirc (val, k, stack, parent) {
  var i
  if (typeof val === 'object' && val !== null) {
    for (i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        var propertyDescriptor = Object.getOwnPropertyDescriptor(parent, k)
        if (propertyDescriptor.get !== undefined) {
          if (propertyDescriptor.configurable) {
            Object.defineProperty(parent, k, { value: '[Circular]' })
            arr.push([parent, k, val, propertyDescriptor])
          } else {
            replacerStack.push([val, k])
          }
        } else {
          parent[k] = '[Circular]'
          arr.push([parent, k, val])
        }
        return
      }
    }
    stack.push(val)
    // Optimize for Arrays. Big arrays could kill the performance otherwise!
    if (Array.isArray(val)) {
      for (i = 0; i < val.length; i++) {
        decirc(val[i], i, stack, val)
      }
    } else {
      var keys = Object.keys(val)
      for (i = 0; i < keys.length; i++) {
        var key = keys[i]
        decirc(val[key], key, stack, val)
      }
    }
    stack.pop()
  }
}

// Stable-stringify
function compareFunction (a, b) {
  if (a < b) {
    return -1
  }
  if (a > b) {
    return 1
  }
  return 0
}

function deterministicStringify (obj, replacer, spacer) {
  var tmp = deterministicDecirc(obj, '', [], undefined) || obj
  var res
  if (replacerStack.length === 0) {
    res = JSON.stringify(tmp, replacer, spacer)
  } else {
    res = JSON.stringify(tmp, replaceGetterValues(replacer), spacer)
  }
  while (arr.length !== 0) {
    var part = arr.pop()
    if (part.length === 4) {
      Object.defineProperty(part[0], part[1], part[3])
    } else {
      part[0][part[1]] = part[2]
    }
  }
  return res
}

function deterministicDecirc (val, k, stack, parent) {
  var i
  if (typeof val === 'object' && val !== null) {
    for (i = 0; i < stack.length; i++) {
      if (stack[i] === val) {
        var propertyDescriptor = Object.getOwnPropertyDescriptor(parent, k)
        if (propertyDescriptor.get !== undefined) {
          if (propertyDescriptor.configurable) {
            Object.defineProperty(parent, k, { value: '[Circular]' })
            arr.push([parent, k, val, propertyDescriptor])
          } else {
            replacerStack.push([val, k])
          }
        } else {
          parent[k] = '[Circular]'
          arr.push([parent, k, val])
        }
        return
      }
    }
    if (typeof val.toJSON === 'function') {
      return
    }
    stack.push(val)
    // Optimize for Arrays. Big arrays could kill the performance otherwise!
    if (Array.isArray(val)) {
      for (i = 0; i < val.length; i++) {
        deterministicDecirc(val[i], i, stack, val)
      }
    } else {
      // Create a temporary object in the required way
      var tmp = {}
      var keys = Object.keys(val).sort(compareFunction)
      for (i = 0; i < keys.length; i++) {
        var key = keys[i]
        deterministicDecirc(val[key], key, stack, val)
        tmp[key] = val[key]
      }
      if (parent !== undefined) {
        arr.push([parent, k, val])
        parent[k] = tmp
      } else {
        return tmp
      }
    }
    stack.pop()
  }
}

// wraps replacer function to handle values we couldn't replace
// and mark them as [Circular]
function replaceGetterValues (replacer) {
  replacer = replacer !== undefined ? replacer : function (k, v) { return v }
  return function (key, val) {
    if (replacerStack.length > 0) {
      for (var i = 0; i < replacerStack.length; i++) {
        var part = replacerStack[i]
        if (part[1] === key && part[0] === val) {
          val = '[Circular]'
          replacerStack.splice(i, 1)
          break
        }
      }
    }
    return replacer.call(this, key, val)
  }
}

},{}],5:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],6:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":5}],7:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":6,"has":10,"has-symbols":8}],8:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":9}],9:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],10:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":6}],11:[function(require,module,exports){
var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var match = String.prototype.match;
var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
var gOPS = Object.getOwnPropertySymbols;
var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
var isEnumerable = Object.prototype.propertyIsEnumerable;

var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
    [].__proto__ === Array.prototype // eslint-disable-line no-proto
        ? function (O) {
            return O.__proto__; // eslint-disable-line no-proto
        }
        : null
);

var inspectCustom = require('./util.inspect').custom;
var inspectSymbol = inspectCustom && isSymbol(inspectCustom) ? inspectCustom : null;
var toStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag !== 'undefined' ? Symbol.toStringTag : null;

module.exports = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean') {
        throw new TypeError('option "customInspect", if provided, must be `true` or `false`');
    }

    if (
        has(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('options "indent" must be "\\t", an integer > 0, or `null`');
    }

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        return String(obj);
    }
    if (typeof obj === 'bigint') {
        return String(obj) + 'n';
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = seen.slice();
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function') {
        var name = nameOf(obj);
        var keys = arrObjKeys(obj, inspect);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + keys.join(', ') + ' }' : '');
    }
    if (isSymbol(obj)) {
        var symString = hasShammedSymbols ? String(obj).replace(/^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
        return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + String(obj.nodeName).toLowerCase();
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + String(obj.nodeName).toLowerCase() + '>';
        return s;
    }
    if (isArray(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + xs.join(', ') + ' ]';
    }
    if (isError(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + parts.join(', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function') {
            return obj[inspectSymbol]();
        } else if (typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap(obj)) {
        var mapParts = [];
        mapForEach.call(obj, function (value, key) {
            mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
        });
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet(obj)) {
        var setParts = [];
        setForEach.call(obj, function (value) {
            setParts.push(inspect(value, obj));
        });
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isWeakRef(obj)) {
        return weakCollectionOf('WeakRef');
    }
    if (isNumber(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
    }
    if (isBoolean(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    if (!isDate(obj) && !isRegExp(obj)) {
        var ys = arrObjKeys(obj, inspect);
        var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
        var protoTag = obj instanceof Object ? '' : 'null prototype';
        var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? toStr(obj).slice(8, -1) : protoTag ? 'Object' : '';
        var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
        var tag = constructorTag + (stringTag || protoTag ? '[' + [].concat(stringTag || [], protoTag || []).join(': ') + '] ' : '');
        if (ys.length === 0) { return tag + '{}'; }
        if (indent) {
            return tag + '{' + indentedJoin(ys, indent) + '}';
        }
        return tag + '{ ' + ys.join(', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return String(s).replace(/"/g, '&quot;');
}

function isArray(obj) { return toStr(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isDate(obj) { return toStr(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isRegExp(obj) { return toStr(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isError(obj) { return toStr(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isString(obj) { return toStr(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isNumber(obj) { return toStr(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isBoolean(obj) { return toStr(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol(obj) {
    if (hasShammedSymbols) {
        return obj && typeof obj === 'object' && obj instanceof Symbol;
    }
    if (typeof obj === 'symbol') {
        return true;
    }
    if (!obj || typeof obj !== 'object' || !symToString) {
        return false;
    }
    try {
        symToString.call(obj);
        return true;
    } catch (e) {}
    return false;
}

function isBigInt(obj) {
    if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
        return false;
    }
    try {
        bigIntValueOf.call(obj);
        return true;
    } catch (e) {}
    return false;
}

var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has(obj, key) {
    return hasOwn.call(obj, key);
}

function toStr(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakRef(x) {
    if (!weakRefDeref || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakRefDeref.call(x);
        return true;
    } catch (e) {}
    return false;
}

function isSet(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString(str.slice(0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = str.replace(/(['\\])/g, '\\$1').replace(/[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b',
        9: 't',
        10: 'n',
        12: 'f',
        13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + n.toString(16).toUpperCase();
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : entries.join(', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = Array(opts.indent + 1).join(' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: Array(depth + 1).join(baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + xs.join(',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
    var symMap;
    if (hasShammedSymbols) {
        symMap = {};
        for (var k = 0; k < syms.length; k++) {
            symMap['$' + syms[k]] = syms[k];
        }
    }

    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
            // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        } else if ((/[^\w$]/).test(key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    if (typeof gOPS === 'function') {
        for (var j = 0; j < syms.length; j++) {
            if (isEnumerable.call(obj, syms[j])) {
                xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
            }
        }
    }
    return xs;
}

},{"./util.inspect":32}],12:[function(require,module,exports){
'use strict';

var replace = String.prototype.replace;
var percentTwenties = /%20/g;

var Format = {
    RFC1738: 'RFC1738',
    RFC3986: 'RFC3986'
};

module.exports = {
    'default': Format.RFC3986,
    formatters: {
        RFC1738: function (value) {
            return replace.call(value, percentTwenties, '+');
        },
        RFC3986: function (value) {
            return String(value);
        }
    },
    RFC1738: Format.RFC1738,
    RFC3986: Format.RFC3986
};

},{}],13:[function(require,module,exports){
'use strict';

var stringify = require('./stringify');
var parse = require('./parse');
var formats = require('./formats');

module.exports = {
    formats: formats,
    parse: parse,
    stringify: stringify
};

},{"./formats":12,"./parse":14,"./stringify":15}],14:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var defaults = {
    allowDots: false,
    allowPrototypes: false,
    allowSparse: false,
    arrayLimit: 20,
    charset: 'utf-8',
    charsetSentinel: false,
    comma: false,
    decoder: utils.decode,
    delimiter: '&',
    depth: 5,
    ignoreQueryPrefix: false,
    interpretNumericEntities: false,
    parameterLimit: 1000,
    parseArrays: true,
    plainObjects: false,
    strictNullHandling: false
};

var interpretNumericEntities = function (str) {
    return str.replace(/&#(\d+);/g, function ($0, numberStr) {
        return String.fromCharCode(parseInt(numberStr, 10));
    });
};

var parseArrayValue = function (val, options) {
    if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
        return val.split(',');
    }

    return val;
};

// This is what browsers will submit when the ✓ character occurs in an
// application/x-www-form-urlencoded body and the encoding of the page containing
// the form is iso-8859-1, or when the submitted form has an accept-charset
// attribute of iso-8859-1. Presumably also with other charsets that do not contain
// the ✓ character, such as us-ascii.
var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

var parseValues = function parseQueryStringValues(str, options) {
    var obj = {};
    var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
    var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
    var parts = cleanStr.split(options.delimiter, limit);
    var skipIndex = -1; // Keep track of where the utf8 sentinel was found
    var i;

    var charset = options.charset;
    if (options.charsetSentinel) {
        for (i = 0; i < parts.length; ++i) {
            if (parts[i].indexOf('utf8=') === 0) {
                if (parts[i] === charsetSentinel) {
                    charset = 'utf-8';
                } else if (parts[i] === isoSentinel) {
                    charset = 'iso-8859-1';
                }
                skipIndex = i;
                i = parts.length; // The eslint settings do not allow break;
            }
        }
    }

    for (i = 0; i < parts.length; ++i) {
        if (i === skipIndex) {
            continue;
        }
        var part = parts[i];

        var bracketEqualsPos = part.indexOf(']=');
        var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

        var key, val;
        if (pos === -1) {
            key = options.decoder(part, defaults.decoder, charset, 'key');
            val = options.strictNullHandling ? null : '';
        } else {
            key = options.decoder(part.slice(0, pos), defaults.decoder, charset, 'key');
            val = utils.maybeMap(
                parseArrayValue(part.slice(pos + 1), options),
                function (encodedVal) {
                    return options.decoder(encodedVal, defaults.decoder, charset, 'value');
                }
            );
        }

        if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
            val = interpretNumericEntities(val);
        }

        if (part.indexOf('[]=') > -1) {
            val = isArray(val) ? [val] : val;
        }

        if (has.call(obj, key)) {
            obj[key] = utils.combine(obj[key], val);
        } else {
            obj[key] = val;
        }
    }

    return obj;
};

var parseObject = function (chain, val, options, valuesParsed) {
    var leaf = valuesParsed ? val : parseArrayValue(val, options);

    for (var i = chain.length - 1; i >= 0; --i) {
        var obj;
        var root = chain[i];

        if (root === '[]' && options.parseArrays) {
            obj = [].concat(leaf);
        } else {
            obj = options.plainObjects ? Object.create(null) : {};
            var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
            var index = parseInt(cleanRoot, 10);
            if (!options.parseArrays && cleanRoot === '') {
                obj = { 0: leaf };
            } else if (
                !isNaN(index)
                && root !== cleanRoot
                && String(index) === cleanRoot
                && index >= 0
                && (options.parseArrays && index <= options.arrayLimit)
            ) {
                obj = [];
                obj[index] = leaf;
            } else {
                obj[cleanRoot] = leaf;
            }
        }

        leaf = obj;
    }

    return leaf;
};

var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
    if (!givenKey) {
        return;
    }

    // Transform dot notation to bracket notation
    var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

    // The regex chunks

    var brackets = /(\[[^[\]]*])/;
    var child = /(\[[^[\]]*])/g;

    // Get the parent

    var segment = options.depth > 0 && brackets.exec(key);
    var parent = segment ? key.slice(0, segment.index) : key;

    // Stash the parent if it exists

    var keys = [];
    if (parent) {
        // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
        if (!options.plainObjects && has.call(Object.prototype, parent)) {
            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(parent);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
        i += 1;
        if (!options.plainObjects && has.call(Object.prototype, segment[1].slice(1, -1))) {
            if (!options.allowPrototypes) {
                return;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return parseObject(keys, val, options, valuesParsed);
};

var normalizeParseOptions = function normalizeParseOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
        throw new TypeError('Decoder has to be a function.');
    }

    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }
    var charset = typeof opts.charset === 'undefined' ? defaults.charset : opts.charset;

    return {
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults.allowPrototypes,
        allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults.allowSparse,
        arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults.arrayLimit,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        comma: typeof opts.comma === 'boolean' ? opts.comma : defaults.comma,
        decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults.decoder,
        delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults.delimiter,
        // eslint-disable-next-line no-implicit-coercion, no-extra-parens
        depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults.depth,
        ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
        interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults.interpretNumericEntities,
        parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults.parameterLimit,
        parseArrays: opts.parseArrays !== false,
        plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults.plainObjects,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (str, opts) {
    var options = normalizeParseOptions(opts);

    if (str === '' || str === null || typeof str === 'undefined') {
        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
        obj = utils.merge(obj, newObj, options);
    }

    if (options.allowSparse === true) {
        return obj;
    }

    return utils.compact(obj);
};

},{"./utils":16}],15:[function(require,module,exports){
'use strict';

var getSideChannel = require('side-channel');
var utils = require('./utils');
var formats = require('./formats');
var has = Object.prototype.hasOwnProperty;

var arrayPrefixGenerators = {
    brackets: function brackets(prefix) {
        return prefix + '[]';
    },
    comma: 'comma',
    indices: function indices(prefix, key) {
        return prefix + '[' + key + ']';
    },
    repeat: function repeat(prefix) {
        return prefix;
    }
};

var isArray = Array.isArray;
var push = Array.prototype.push;
var pushToArray = function (arr, valueOrArray) {
    push.apply(arr, isArray(valueOrArray) ? valueOrArray : [valueOrArray]);
};

var toISO = Date.prototype.toISOString;

var defaultFormat = formats['default'];
var defaults = {
    addQueryPrefix: false,
    allowDots: false,
    charset: 'utf-8',
    charsetSentinel: false,
    delimiter: '&',
    encode: true,
    encoder: utils.encode,
    encodeValuesOnly: false,
    format: defaultFormat,
    formatter: formats.formatters[defaultFormat],
    // deprecated
    indices: false,
    serializeDate: function serializeDate(date) {
        return toISO.call(date);
    },
    skipNulls: false,
    strictNullHandling: false
};

var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
    return typeof v === 'string'
        || typeof v === 'number'
        || typeof v === 'boolean'
        || typeof v === 'symbol'
        || typeof v === 'bigint';
};

var stringify = function stringify(
    object,
    prefix,
    generateArrayPrefix,
    strictNullHandling,
    skipNulls,
    encoder,
    filter,
    sort,
    allowDots,
    serializeDate,
    format,
    formatter,
    encodeValuesOnly,
    charset,
    sideChannel
) {
    var obj = object;

    if (sideChannel.has(object)) {
        throw new RangeError('Cyclic object value');
    }

    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    } else if (obj instanceof Date) {
        obj = serializeDate(obj);
    } else if (generateArrayPrefix === 'comma' && isArray(obj)) {
        obj = utils.maybeMap(obj, function (value) {
            if (value instanceof Date) {
                return serializeDate(value);
            }
            return value;
        });
    }

    if (obj === null) {
        if (strictNullHandling) {
            return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key', format) : prefix;
        }

        obj = '';
    }

    if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
        if (encoder) {
            var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key', format);
            return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
        }
        return [formatter(prefix) + '=' + formatter(String(obj))];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys;
    if (generateArrayPrefix === 'comma' && isArray(obj)) {
        // we need to join elements in
        objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : undefined }];
    } else if (isArray(filter)) {
        objKeys = filter;
    } else {
        var keys = Object.keys(obj);
        objKeys = sort ? keys.sort(sort) : keys;
    }

    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];
        var value = typeof key === 'object' && key.value !== undefined ? key.value : obj[key];

        if (skipNulls && value === null) {
            continue;
        }

        var keyPrefix = isArray(obj)
            ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(prefix, key) : prefix
            : prefix + (allowDots ? '.' + key : '[' + key + ']');

        sideChannel.set(object, true);
        var valueSideChannel = getSideChannel();
        pushToArray(values, stringify(
            value,
            keyPrefix,
            generateArrayPrefix,
            strictNullHandling,
            skipNulls,
            encoder,
            filter,
            sort,
            allowDots,
            serializeDate,
            format,
            formatter,
            encodeValuesOnly,
            charset,
            valueSideChannel
        ));
    }

    return values;
};

var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
    if (!opts) {
        return defaults;
    }

    if (opts.encoder !== null && opts.encoder !== undefined && typeof opts.encoder !== 'function') {
        throw new TypeError('Encoder has to be a function.');
    }

    var charset = opts.charset || defaults.charset;
    if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
        throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
    }

    var format = formats['default'];
    if (typeof opts.format !== 'undefined') {
        if (!has.call(formats.formatters, opts.format)) {
            throw new TypeError('Unknown format option provided.');
        }
        format = opts.format;
    }
    var formatter = formats.formatters[format];

    var filter = defaults.filter;
    if (typeof opts.filter === 'function' || isArray(opts.filter)) {
        filter = opts.filter;
    }

    return {
        addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
        allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
        charset: charset,
        charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
        delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
        encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
        encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
        encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
        filter: filter,
        format: format,
        formatter: formatter,
        serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
        skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
        sort: typeof opts.sort === 'function' ? opts.sort : null,
        strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
    };
};

module.exports = function (object, opts) {
    var obj = object;
    var options = normalizeStringifyOptions(opts);

    var objKeys;
    var filter;

    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    } else if (isArray(options.filter)) {
        filter = options.filter;
        objKeys = filter;
    }

    var keys = [];

    if (typeof obj !== 'object' || obj === null) {
        return '';
    }

    var arrayFormat;
    if (opts && opts.arrayFormat in arrayPrefixGenerators) {
        arrayFormat = opts.arrayFormat;
    } else if (opts && 'indices' in opts) {
        arrayFormat = opts.indices ? 'indices' : 'repeat';
    } else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }

    if (options.sort) {
        objKeys.sort(options.sort);
    }

    var sideChannel = getSideChannel();
    for (var i = 0; i < objKeys.length; ++i) {
        var key = objKeys[i];

        if (options.skipNulls && obj[key] === null) {
            continue;
        }
        pushToArray(keys, stringify(
            obj[key],
            key,
            generateArrayPrefix,
            options.strictNullHandling,
            options.skipNulls,
            options.encode ? options.encoder : null,
            options.filter,
            options.sort,
            options.allowDots,
            options.serializeDate,
            options.format,
            options.formatter,
            options.encodeValuesOnly,
            options.charset,
            sideChannel
        ));
    }

    var joined = keys.join(options.delimiter);
    var prefix = options.addQueryPrefix === true ? '?' : '';

    if (options.charsetSentinel) {
        if (options.charset === 'iso-8859-1') {
            // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
            prefix += 'utf8=%26%2310003%3B&';
        } else {
            // encodeURIComponent('✓')
            prefix += 'utf8=%E2%9C%93&';
        }
    }

    return joined.length > 0 ? prefix + joined : '';
};

},{"./formats":12,"./utils":16,"side-channel":17}],16:[function(require,module,exports){
'use strict';

var formats = require('./formats');

var has = Object.prototype.hasOwnProperty;
var isArray = Array.isArray;

var hexTable = (function () {
    var array = [];
    for (var i = 0; i < 256; ++i) {
        array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
    }

    return array;
}());

var compactQueue = function compactQueue(queue) {
    while (queue.length > 1) {
        var item = queue.pop();
        var obj = item.obj[item.prop];

        if (isArray(obj)) {
            var compacted = [];

            for (var j = 0; j < obj.length; ++j) {
                if (typeof obj[j] !== 'undefined') {
                    compacted.push(obj[j]);
                }
            }

            item.obj[item.prop] = compacted;
        }
    }
};

var arrayToObject = function arrayToObject(source, options) {
    var obj = options && options.plainObjects ? Object.create(null) : {};
    for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== 'undefined') {
            obj[i] = source[i];
        }
    }

    return obj;
};

var merge = function merge(target, source, options) {
    /* eslint no-param-reassign: 0 */
    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (isArray(target)) {
            target.push(source);
        } else if (target && typeof target === 'object') {
            if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
                target[source] = true;
            }
        } else {
            return [target, source];
        }

        return target;
    }

    if (!target || typeof target !== 'object') {
        return [target].concat(source);
    }

    var mergeTarget = target;
    if (isArray(target) && !isArray(source)) {
        mergeTarget = arrayToObject(target, options);
    }

    if (isArray(target) && isArray(source)) {
        source.forEach(function (item, i) {
            if (has.call(target, i)) {
                var targetItem = target[i];
                if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                    target[i] = merge(targetItem, item, options);
                } else {
                    target.push(item);
                }
            } else {
                target[i] = item;
            }
        });
        return target;
    }

    return Object.keys(source).reduce(function (acc, key) {
        var value = source[key];

        if (has.call(acc, key)) {
            acc[key] = merge(acc[key], value, options);
        } else {
            acc[key] = value;
        }
        return acc;
    }, mergeTarget);
};

var assign = function assignSingleSource(target, source) {
    return Object.keys(source).reduce(function (acc, key) {
        acc[key] = source[key];
        return acc;
    }, target);
};

var decode = function (str, decoder, charset) {
    var strWithoutPlus = str.replace(/\+/g, ' ');
    if (charset === 'iso-8859-1') {
        // unescape never throws, no try...catch needed:
        return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
    }
    // utf-8
    try {
        return decodeURIComponent(strWithoutPlus);
    } catch (e) {
        return strWithoutPlus;
    }
};

var encode = function encode(str, defaultEncoder, charset, kind, format) {
    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    var string = str;
    if (typeof str === 'symbol') {
        string = Symbol.prototype.toString.call(str);
    } else if (typeof str !== 'string') {
        string = String(str);
    }

    if (charset === 'iso-8859-1') {
        return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
            return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
        });
    }

    var out = '';
    for (var i = 0; i < string.length; ++i) {
        var c = string.charCodeAt(i);

        if (
            c === 0x2D // -
            || c === 0x2E // .
            || c === 0x5F // _
            || c === 0x7E // ~
            || (c >= 0x30 && c <= 0x39) // 0-9
            || (c >= 0x41 && c <= 0x5A) // a-z
            || (c >= 0x61 && c <= 0x7A) // A-Z
            || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
        ) {
            out += string.charAt(i);
            continue;
        }

        if (c < 0x80) {
            out = out + hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
            continue;
        }

        i += 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
        out += hexTable[0xF0 | (c >> 18)]
            + hexTable[0x80 | ((c >> 12) & 0x3F)]
            + hexTable[0x80 | ((c >> 6) & 0x3F)]
            + hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

var compact = function compact(value) {
    var queue = [{ obj: { o: value }, prop: 'o' }];
    var refs = [];

    for (var i = 0; i < queue.length; ++i) {
        var item = queue[i];
        var obj = item.obj[item.prop];

        var keys = Object.keys(obj);
        for (var j = 0; j < keys.length; ++j) {
            var key = keys[j];
            var val = obj[key];
            if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                queue.push({ obj: obj, prop: key });
                refs.push(val);
            }
        }
    }

    compactQueue(queue);

    return value;
};

var isRegExp = function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var isBuffer = function isBuffer(obj) {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
};

var combine = function combine(a, b) {
    return [].concat(a, b);
};

var maybeMap = function maybeMap(val, fn) {
    if (isArray(val)) {
        var mapped = [];
        for (var i = 0; i < val.length; i += 1) {
            mapped.push(fn(val[i]));
        }
        return mapped;
    }
    return fn(val);
};

module.exports = {
    arrayToObject: arrayToObject,
    assign: assign,
    combine: combine,
    compact: compact,
    decode: decode,
    encode: encode,
    isBuffer: isBuffer,
    isRegExp: isRegExp,
    maybeMap: maybeMap,
    merge: merge
};

},{"./formats":12}],17:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');
var callBound = require('call-bind/callBound');
var inspect = require('object-inspect');

var $TypeError = GetIntrinsic('%TypeError%');
var $WeakMap = GetIntrinsic('%WeakMap%', true);
var $Map = GetIntrinsic('%Map%', true);

var $weakMapGet = callBound('WeakMap.prototype.get', true);
var $weakMapSet = callBound('WeakMap.prototype.set', true);
var $weakMapHas = callBound('WeakMap.prototype.has', true);
var $mapGet = callBound('Map.prototype.get', true);
var $mapSet = callBound('Map.prototype.set', true);
var $mapHas = callBound('Map.prototype.has', true);

/*
 * This function traverses the list returning the node corresponding to the
 * given key.
 *
 * That node is also moved to the head of the list, so that if it's accessed
 * again we don't need to traverse the whole list. By doing so, all the recently
 * used nodes can be accessed relatively quickly.
 */
var listGetNode = function (list, key) { // eslint-disable-line consistent-return
	for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
		if (curr.key === key) {
			prev.next = curr.next;
			curr.next = list.next;
			list.next = curr; // eslint-disable-line no-param-reassign
			return curr;
		}
	}
};

var listGet = function (objects, key) {
	var node = listGetNode(objects, key);
	return node && node.value;
};
var listSet = function (objects, key, value) {
	var node = listGetNode(objects, key);
	if (node) {
		node.value = value;
	} else {
		// Prepend the new node to the beginning of the list
		objects.next = { // eslint-disable-line no-param-reassign
			key: key,
			next: objects.next,
			value: value
		};
	}
};
var listHas = function (objects, key) {
	return !!listGetNode(objects, key);
};

module.exports = function getSideChannel() {
	var $wm;
	var $m;
	var $o;
	var channel = {
		assert: function (key) {
			if (!channel.has(key)) {
				throw new $TypeError('Side channel does not contain ' + inspect(key));
			}
		},
		get: function (key) { // eslint-disable-line consistent-return
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapGet($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapGet($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listGet($o, key);
				}
			}
		},
		has: function (key) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapHas($wm, key);
				}
			} else if ($Map) {
				if ($m) {
					return $mapHas($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listHas($o, key);
				}
			}
			return false;
		},
		set: function (key, value) {
			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
				if (!$wm) {
					$wm = new $WeakMap();
				}
				$weakMapSet($wm, key, value);
			} else if ($Map) {
				if (!$m) {
					$m = new $Map();
				}
				$mapSet($m, key, value);
			} else {
				if (!$o) {
					/*
					 * Initialize the linked list as an empty node, so that we don't have
					 * to special-case handling of the first node: we can always refer to
					 * it as (previous node).next, instead of something like (list).head
					 */
					$o = { key: {}, next: null };
				}
				listSet($o, key, value);
			}
		}
	};
	return channel;
};

},{"call-bind/callBound":1,"get-intrinsic":7,"object-inspect":11}],18:[function(require,module,exports){
'use strict';

var Request = require('./base-request');

var DEFAULT_HOST = 'accounts.spotify.com',
  DEFAULT_PORT = 443,
  DEFAULT_SCHEME = 'https';

module.exports.builder = function() {
  return Request.builder()
    .withHost(DEFAULT_HOST)
    .withPort(DEFAULT_PORT)
    .withScheme(DEFAULT_SCHEME);
};

},{"./base-request":19}],19:[function(require,module,exports){
'use strict';

var Request = function(builder) {
  if (!builder) {
    throw new Error('No builder supplied to constructor');
  }

  this.host = builder.host;
  this.port = builder.port;
  this.scheme = builder.scheme;
  this.queryParameters = builder.queryParameters;
  this.bodyParameters = builder.bodyParameters;
  this.headers = builder.headers;
  this.path = builder.path;
};

Request.prototype._getter = function(key) {
  return function() {
    return this[key];
  };
};

Request.prototype.getHost = Request.prototype._getter('host');

Request.prototype.getPort = Request.prototype._getter('port');

Request.prototype.getScheme = Request.prototype._getter('scheme');

Request.prototype.getPath = Request.prototype._getter('path');

Request.prototype.getQueryParameters = Request.prototype._getter(
  'queryParameters'
);

Request.prototype.getBodyParameters = Request.prototype._getter(
  'bodyParameters'
);

Request.prototype.getHeaders = Request.prototype._getter('headers');

Request.prototype.getURI = function() {
  if (!this.scheme || !this.host || !this.port) {
    throw new Error('Missing components necessary to construct URI');
  }
  var uri = this.scheme + '://' + this.host;
  if (
    (this.scheme === 'http' && this.port !== 80) ||
    (this.scheme === 'https' && this.port !== 443)
  ) {
    uri += ':' + this.port;
  }
  if (this.path) {
    uri += this.path;
  }
  return uri;
};

Request.prototype.getURL = function() {
  var uri = this.getURI();
  if (this.getQueryParameters()) {
    return uri + this.getQueryParameterString(this.getQueryParameters());
  } else {
    return uri;
  }
};

Request.prototype.getQueryParameterString = function() {
  var queryParameters = this.getQueryParameters();
  if (queryParameters) {
    return (
      '?' +
      Object.keys(queryParameters)
        .filter(function(key) {
          return queryParameters[key] !== undefined;
        })
        .map(function(key) {
          return key + '=' + queryParameters[key];
        })
        .join('&')
    );
  }
};

Request.prototype.execute = function(method, callback) {
  if (callback) {
    method(this, callback);
    return;
  }
  var _self = this;

  return new Promise(function(resolve, reject) {
    method(_self, function(error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

var Builder = function() {};

Builder.prototype._setter = function(key) {
  return function(value) {
    this[key] = value;
    return this;
  };
};

Builder.prototype.withHost = Builder.prototype._setter('host');

Builder.prototype.withPort = Builder.prototype._setter('port');

Builder.prototype.withScheme = Builder.prototype._setter('scheme');

Builder.prototype.withPath = Builder.prototype._setter('path');

Builder.prototype._assigner = function(key) {
  return function() {
    for (var i = 0; i < arguments.length; i++) {
      this[key] = this._assign(this[key], arguments[i]);
    }
    
    return this;
  };
};

Builder.prototype.withQueryParameters = Builder.prototype._assigner(
  'queryParameters'
);

Builder.prototype.withBodyParameters = Builder.prototype._assigner(
  'bodyParameters'
);

Builder.prototype.withHeaders = Builder.prototype._assigner('headers');

Builder.prototype.withAuth = function(accessToken) {
  if (accessToken) {
    this.withHeaders({ Authorization: 'Bearer ' + accessToken });
  }
  return this;
};

Builder.prototype._assign = function(src, obj) {
  if (obj && Array.isArray(obj)) {
    return obj;
  }
  if (obj && typeof obj === 'string') {
    return obj;
  }
  if (obj && Object.keys(obj).length > 0) {
    return Object.assign(src || {}, obj);
  }
  return src;
};

Builder.prototype.build = function() {
  return new Request(this);
};

module.exports.builder = function() {
  return new Builder();
};

},{}],20:[function(require,module,exports){
module.exports = require('./spotify-web-api');

},{"./spotify-web-api":23}],21:[function(require,module,exports){
'use strict';

var superagent = require('superagent'),
  { TimeoutError, 
    WebapiError, 
    WebapiRegularError, 
    WebapiAuthenticationError,
    WebapiPlayerError 
  } =  require('./response-error');

var HttpManager = {};

/* Create superagent options from the base request */
var _getParametersFromRequest = function(request) {
  var options = {};

  if (request.getQueryParameters()) {
    options.query = request.getQueryParameters();
  }

  if (request.getHeaders() && request.getHeaders()['Content-Type'] === 'application/json') {
    options.data = JSON.stringify(request.getBodyParameters());
  } else if (request.getBodyParameters()) {
    options.data = request.getBodyParameters();
  }

  if (request.getHeaders()) {
    options.headers = request.getHeaders();
  }
  return options;
};

var _toError = function(response) {
  if (typeof response.body === 'object' && response.body.error && typeof response.body.error === 'object' && response.body.error.reason) {
    return new WebapiPlayerError(response.body, response.headers, response.statusCode);
  }

  if (typeof response.body === 'object' && response.body.error && typeof response.body.error === 'object') {
    return new WebapiRegularError(response.body, response.headers, response.statusCode);
  }

  if (typeof response.body === 'object' && response.body.error && typeof response.body.error === 'string') {
    return new WebapiAuthenticationError(response.body, response.headers, response.statusCode);
  }
  
  /* Other type of error, or unhandled Web API error format */
  return new WebapiError(response.body, response.headers, response.statusCode, response.body);
};

/* Make the request to the Web API */
HttpManager._makeRequest = function(method, options, uri, callback) {
  var req = method.bind(superagent)(uri);

  if (options.query) {
    req.query(options.query);
  }

  if (options.headers) {
    req.set(options.headers);
  }

  if (options.data) {
    req.send(options.data);
  }

  req.end(function(err, response) {
    if (err) {
      if (err.timeout) {
        return callback(new TimeoutError());
      } else if (err.response) {
        return callback(_toError(err.response));
      } else {
        return callback(err);
      }
    }

    return callback(null, {
      body: response.body,
      headers: response.headers,
      statusCode: response.statusCode
    });
  });
};

/**
 * Make a HTTP GET request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.get = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = superagent.get;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP POST request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.post = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = superagent.post;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP DELETE request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.del = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = superagent.del;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP PUT request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.put = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = superagent.put;

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

module.exports = HttpManager;
},{"./response-error":22,"superagent":26}],22:[function(require,module,exports){
/* Timeout */
class NamedError extends Error {
  get name() {
    return this.constructor.name;
  }  
}

class TimeoutError extends NamedError {
  constructor() {
    const message = 'A timeout occurred while communicating with Spotify\'s Web API.';
    super(message);
  }

}

/* Web API Parent and fallback error */
class WebapiError extends NamedError {
  constructor(body, headers, statusCode, message) {
    super(message);
    this.body = body;
    this.headers = headers;
    this.statusCode = statusCode;
  }

}

/** 
 * Regular Error
 * { status : <integer>, message : <string> }
 */
class WebapiRegularError extends WebapiError {
  constructor(body, headers, statusCode) {
    const message = 'An error occurred while communicating with Spotify\'s Web API.\n' +
    'Details: ' + body.error.message + '.';

    super(body, headers, statusCode, message);
  }
}

/**
 * Authentication Error 
 * { error : <string>, error_description : <string> }
 */
class WebapiAuthenticationError extends WebapiError {
  constructor(body, headers, statusCode) {
    const message = 'An authentication error occurred while communicating with Spotify\'s Web API.\n' +
    'Details: ' + body.error + (body.error_description ? ' ' + body.error_description + '.' : '.');

    super(body, headers, statusCode, message);
  }
}

/**
 * Player Error 
 * { status : <integer>, message : <string>, reason : <string> }
 */
class WebapiPlayerError extends WebapiError {
  constructor(body, headers, statusCode) {
    const message = 'An error occurred while communicating with Spotify\'s Web API.\n' +
    'Details: ' + body.error.message + (body.error.reason ? ' ' + body.error.reason + '.' : '.');

    super(body, headers, statusCode, message);
  }
}

module.exports = { WebapiError, TimeoutError, WebapiRegularError, WebapiAuthenticationError, WebapiPlayerError };
},{}],23:[function(require,module,exports){
'use strict';

var AuthenticationRequest = require('./authentication-request'),
  WebApiRequest = require('./webapi-request'),
  HttpManager = require('./http-manager');

function SpotifyWebApi(credentials) {
  this._credentials = credentials || {};
}

SpotifyWebApi.prototype = {
  setCredentials: function(credentials) {
    for (var key in credentials) {
      if (credentials.hasOwnProperty(key)) {
        this._credentials[key] = credentials[key];
      }
    }
  },

  getCredentials: function() {
    return this._credentials;
  },

  resetCredentials: function() {
    this._credentials = null;
  },

  setClientId: function(clientId) {
    this._setCredential('clientId', clientId);
  },

  setClientSecret: function(clientSecret) {
    this._setCredential('clientSecret', clientSecret);
  },

  setAccessToken: function(accessToken) {
    this._setCredential('accessToken', accessToken);
  },

  setRefreshToken: function(refreshToken) {
    this._setCredential('refreshToken', refreshToken);
  },

  setRedirectURI: function(redirectUri) {
    this._setCredential('redirectUri', redirectUri);
  },

  getRedirectURI: function() {
    return this._getCredential('redirectUri');
  },

  getClientId: function() {
    return this._getCredential('clientId');
  },

  getClientSecret: function() {
    return this._getCredential('clientSecret');
  },

  getAccessToken: function() {
    return this._getCredential('accessToken');
  },

  getRefreshToken: function() {
    return this._getCredential('refreshToken');
  },

  resetClientId: function() {
    this._resetCredential('clientId');
  },

  resetClientSecret: function() {
    this._resetCredential('clientSecret');
  },

  resetAccessToken: function() {
    this._resetCredential('accessToken');
  },

  resetRefreshToken: function() {
    this._resetCredential('refreshToken');
  },

  resetRedirectURI: function() {
    this._resetCredential('redirectUri');
  },

  _setCredential: function(credentialKey, value) {
    this._credentials = this._credentials || {};
    this._credentials[credentialKey] = value;
  },

  _getCredential: function(credentialKey) {
    if (!this._credentials) {
      return;
    } else {
      return this._credentials[credentialKey];
    }
  },

  _resetCredential: function(credentialKey) {
    if (!this._credentials) {
      return;
    } else {
      this._credentials[credentialKey] = null;
    }
  },

  /**
   * Look up a track.
   * @param {string} trackId The track's ID.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getTrack('3Qm86XLflmIXVm1wcwkgDK').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the track. Not returned if a callback is given.
   */
  getTrack: function(trackId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/tracks/' + trackId)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up several tracks.
   * @param {string[]} trackIds The IDs of the artists.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtists(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the artists. Not returned if a callback is given.
   */
  getTracks: function(trackIds, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/tracks')
      .withQueryParameters(
        {
          ids: trackIds.join(',')
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up an album.
   * @param {string} albumId The album's ID.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAlbum('0sNOF9WDwhWunNAHPD3Baj').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the album. Not returned if a callback is given.
   */
  getAlbum: function(albumId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/albums/' + albumId)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up several albums.
   * @param {string[]} albumIds The IDs of the albums.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAlbums(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the albums. Not returned if a callback is given.
   */
  getAlbums: function(albumIds, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/albums')
      .withQueryParameters(
        {
          ids: albumIds.join(',')
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up an artist.
   * @param {string} artistId The artist's ID.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example api.getArtist('1u7kkVrr14iBvrpYnZILJR').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the artist. Not returned if a callback is given.
   */
  getArtist: function(artistId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/artists/' + artistId)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up several artists.
   * @param {string[]} artistIds The IDs of the artists.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtists(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the artists. Not returned if a callback is given.
   */
  getArtists: function(artistIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/artists')
      .withQueryParameters({
        ids: artistIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Search for music entities of certain types.
   * @param {string} query The search query.
   * @param {string[]} types An array of item types to search across.
   * Valid types are: 'album', 'artist', 'playlist', 'track', 'show', and 'episode'.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example search('Abba', ['track', 'playlist'], { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  search: function(query, types, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/search/')
      .withQueryParameters(
        {
          type: types.join(','),
          q: query
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Search for an album.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchAlbums('Space Oddity', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchAlbums: function(query, options, callback) {
    return this.search(query, ['album'], options, callback);
  },

  /**
   * Search for an artist.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchArtists('David Bowie', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchArtists: function(query, options, callback) {
    return this.search(query, ['artist'], options, callback);
  },

  /**
   * Search for a track.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchTracks('Mr. Brightside', { limit : 3, offset : 2 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchTracks: function(query, options, callback) {
    return this.search(query, ['track'], options, callback);
  },

  /**
   * Search for playlists.
   * @param {string} query The search query.
   * @param {Object} options The possible options.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchPlaylists('workout', { limit : 1, offset : 0 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchPlaylists: function(query, options, callback) {
    return this.search(query, ['playlist'], options, callback);
  },

  /**
   * Get an artist's albums.
   * @param {string} artistId The artist's ID.
   * @options {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtistAlbums('0oSGxfWSnnOXhD2fKuz2Gy', { album_type : 'album', country : 'GB', limit : 2, offset : 5 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the albums
   *          for the given artist. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  getArtistAlbums: function(artistId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/artists/' + artistId + '/albums')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the tracks of an album.
   * @param albumId the album's ID.
   * @options {Object} [options] The possible options, e.g. limit.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAlbumTracks('41MnTivkwTO3UUJ8DrqEJJ', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *                    tracks in the album. The result is paginated. If the promise is rejected.
   *                    it contains an error object. Not returned if a callback is given.
   */
  getAlbumTracks: function(albumId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/albums/' + albumId + '/tracks')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get an artist's top tracks.
   * @param {string} artistId The artist's ID.
   * @param {string} country The country/territory where the tracks are most popular. (format: ISO 3166-1 alpha-2)
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtistTopTracks('0oSGxfWSnnOXhD2fKuz2Gy', 'GB').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          artist's top tracks in the given country. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  getArtistTopTracks: function(artistId, country, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/artists/' + artistId + '/top-tracks')
      .withQueryParameters({
        country: country
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get related artists.
   * @param {string} artistId The artist's ID.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getArtistRelatedArtists('0oSGxfWSnnOXhD2fKuz2Gy').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          related artists. If the promise is rejected, it contains an error object. Not returned if a callback is given.
   */
  getArtistRelatedArtists: function(artistId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/artists/' + artistId + '/related-artists')
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get information about a user.
   * @param userId The user ID.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getUser('thelinmichael').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the user. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  getUser: function(userId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/users/' + encodeURIComponent(userId))
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get information about the user that has signed in (the current user).
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getMe().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the user. The amount of information
   *          depends on the permissions given by the user. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  getMe: function(callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me')
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get a user's playlists.
   * @param {string} userId An optional id of the user. If you know the Spotify URI it is easy
   * to find the id (e.g. spotify:user:<here_is_the_id>). If not provided, the id of the user that granted
   * the permissions will be used.
   * @param {Object} [options] The options supplied to this request.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getUserPlaylists('thelinmichael').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          a list of playlists. If rejected, it contains an error object. Not returned if a callback is given.
   */
  getUserPlaylists: function(userId, options, callback) {
    var path;
    if (typeof userId === 'string') {
      path = '/v1/users/' + encodeURIComponent(userId) + '/playlists';
    } else if (typeof userId === 'object') {
      callback = options;
      options = userId;
      path = '/v1/me/playlists';
    } /* undefined */ else {
      path = '/v1/me/playlists';
    }

    return WebApiRequest.builder(this.getAccessToken())
      .withPath(path)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get a playlist.
   * @param {string} playlistId The playlist's ID.
   * @param {Object} [options] The options supplied to this request.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getPlaylist('3EsfV6XzCHU8SPNdbnFogK').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          the playlist. If rejected, it contains an error object. Not returned if a callback is given.
   */
  getPlaylist: function(playlistId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get tracks in a playlist.
   * @param {string} playlistId The playlist's ID.
   * @param {Object} [options] Optional options, such as fields.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getPlaylistTracks('3ktAYNcRHpazJ9qecm3ptn').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object that containing
   * the tracks in the playlist. If rejected, it contains an error object. Not returned if a callback is given.
   */
  getPlaylistTracks: function(playlistId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Create a playlist.
   * @param {string} [name] The name of the playlist.
   * @param {Object} [options] The possible options, being description, collaborative and public.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example createPlaylist('My playlist', {''description': 'My description', 'collaborative' : false, 'public': true}).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing information about the
   *          created playlist. If rejected, it contains an error object. Not returned if a callback is given.
   */
  createPlaylist: function(name, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/playlists')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters({
        name : name,
      }, options)
      .build()
      .execute(HttpManager.post, callback);
  },

  /**
   * Follow a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {Object} [options] The possible options, currently only public.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  followPlaylist: function(playlistId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/followers')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(options)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Unfollow a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  unfollowPlaylist: function(playlistId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/followers')
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Change playlist details.
   * @param {string} playlistId The playlist's ID
   * @param {Object} [options] The possible options, e.g. name, public.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example changePlaylistDetails('3EsfV6XzCHU8SPNdbnFogK', {name: 'New name', public: true}).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  changePlaylistDetails: function(playlistId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId)
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(options)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Replace the image used to represent a specific playlist.
   * @param {string} playlistId The playlist's ID
   * @param {string} base64URI Base64 encoded JPEG image data, maximum payload size is 256 KB
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example uploadCustomPlaylistCoverImage('3EsfV6XzCHU8SPNdbnFogK', 'longbase64uri').then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  uploadCustomPlaylistCoverImage: function(playlistId, base64URI, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/images')
      .withHeaders({ 'Content-Type': 'image/jpeg' })
      .withBodyParameters(base64URI)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Add tracks to a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {string[]} tracks URIs of the tracks to add to the playlist.
   * @param {Object} [options] Options, position being the only one.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example addTracksToPlaylist('3EsfV6XzCHU8SPNdbnFogK',
              '["spotify:track:4iV5W9uYEdYUVa79Axb7Rh", "spotify:track:1301WleyT98MSxVHPZCA6M"]').then(...)
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  addTracksToPlaylist: function(playlistId, tracks, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withQueryParameters(options)
      .withBodyParameters({
        uris: tracks
      })
      .build()
      .execute(HttpManager.post, callback);
  },

  /**
   * Remove tracks from a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {Object[]} tracks An array of objects containing a property called uri with the track URI (String), and
   * an optional property called positions (int[]), e.g. { uri : "spotify:track:491rM2JN8KvmV6p0oDDuJT", positions : [0, 15] }
   * @param {Object} options Options, snapshot_id being the only one.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  removeTracksFromPlaylist: function(playlistId, tracks, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(
        {
          tracks: tracks
        }, 
        options
      )
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Remove tracks from a playlist by position instead of specifying the tracks' URIs.
   * @param {string} playlistId The playlist's ID
   * @param {int[]} positions The positions of the tracks in the playlist that should be removed
   * @param {string} snapshot_id The snapshot ID, or version, of the playlist. Required
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  removeTracksFromPlaylistByPosition: function(
    playlistId,
    positions,
    snapshotId,
    callback
  ) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters({
        positions: positions,
        snapshot_id: snapshotId
      })
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Replace tracks in a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {Object[]} uris An array of track URIs (strings)
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an empty object. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  replaceTracksInPlaylist: function(playlistId, uris, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters({
        uris: uris
      })
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Reorder tracks in a playlist.
   * @param {string} playlistId The playlist's ID
   * @param {int} rangeStart The position of the first track to be reordered.
   * @param {int} insertBefore The position where the tracks should be inserted.
   * @param {Object} options Optional parameters, i.e. range_length and snapshot_id.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an object containing a snapshot_id. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  reorderTracksInPlaylist: function(
    playlistId,
    rangeStart,
    insertBefore,
    options,
    callback
  ) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/playlists/' + playlistId + '/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(
        {
          range_start: rangeStart,
          insert_before: insertBefore
        },
        options
      )
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Get audio features for a single track identified by its unique Spotify ID.
   * @param {string} trackId The track ID
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAudioFeaturesForTrack('38P3Q4QcdjQALGF2Z92BmR').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the audio features. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  getAudioFeaturesForTrack: function(trackId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/audio-features/' + trackId)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get audio analysis for a single track identified by its unique Spotify ID.
   * @param {string} trackId The track ID
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAudioAnalysisForTrack('38P3Q4QcdjQALGF2Z92BmR').then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the audio analysis. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  getAudioAnalysisForTrack: function(trackId, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/audio-analysis/' + trackId)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get audio features for multiple tracks identified by their unique Spotify ID.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAudioFeaturesForTracks(['38P3Q4QcdjQALGF2Z92BmR', '2HO2bnoMrpnZUbUqiilLHi']).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object
   *          containing information about the audio features for the tracks. If the promise is
   *          rejected, it contains an error object. Not returned if a callback is given.
   */
  getAudioFeaturesForTracks: function(trackIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/audio-features')
      .withQueryParameters({
        ids: trackIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Create a playlist-style listening experience based on seed artists, tracks and genres.
   * @param {Object} [options] The options supplied to this request.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getRecommendations({ min_energy: 0.4, seed_artists: ['6mfK6Q2tzLMEchAr0e9Uzu', '4DYFVNKZ1uixa6SQTvzQwJ'], min_popularity: 50 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          a list of tracks and a list of seeds. If rejected, it contains an error object. Not returned if a callback is given.
   */
  getRecommendations: function(options, callback) {
    var _opts = {};
    var optionsOfTypeArray = ['seed_artists', 'seed_genres', 'seed_tracks'];
    for (var option in options) {
      if (options.hasOwnProperty(option)) {
        if (
          optionsOfTypeArray.indexOf(option) !== -1 &&
          Object.prototype.toString.call(options[option]) === '[object Array]'
        ) {
          _opts[option] = options[option].join(',');
        } else {
          _opts[option] = options[option];
        }
      }
    }

    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/recommendations')
      .withQueryParameters(_opts)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve a list of available genres seed parameter values for recommendations.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getAvailableGenreSeeds().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing
   *          a list of available genres to be used as seeds for recommendations.
   *          If rejected, it contains an error object. Not returned if a callback is given.
   */
  getAvailableGenreSeeds: function(callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/recommendations/available-genre-seeds')
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve the tracks that are saved to the authenticated users Your Music library.
   * @param {Object} [options] Options, being market, limit, and/or offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which in turn contains
   *          playlist track objects. Not returned if a callback is given.
   */
  getMySavedTracks: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/tracks')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Check if one or more tracks is already saved in the current Spotify user’s “Your Music” library.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   * of the returned array's elements correspond to the track ID in the request.
   * The boolean value of true indicates that the track is part of the user's library, otherwise false.
   * Not returned if a callback is given.
   */
  containsMySavedTracks: function(trackIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/tracks/contains')
      .withQueryParameters({
        ids: trackIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Remove a track from the authenticated user's Your Music library.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error.
   * Not returned if a callback is given.
   */
  removeFromMySavedTracks: function(trackIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters({ ids: trackIds })
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Add a track from the authenticated user's Your Music library.
   * @param {string[]} trackIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error. Not returned if a callback is given.
   */
  addToMySavedTracks: function(trackIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/tracks')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters({ ids: trackIds })
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Remove an album from the authenticated user's Your Music library.
   * @param {string[]} albumIds The album IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error.
   * Not returned if a callback is given.
   */
  removeFromMySavedAlbums: function(albumIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/albums')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(albumIds)
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Add an album from the authenticated user's Your Music library.
   * @param {string[]} albumIds The track IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error. Not returned if a callback is given.
   */
  addToMySavedAlbums: function(albumIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/albums')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(albumIds)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Retrieve the albums that are saved to the authenticated users Your Music library.
   * @param {Object} [options] Options, being market, limit, and/or offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which in turn contains
   *          playlist album objects. Not returned if a callback is given.
   */
  getMySavedAlbums: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/albums')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Check if one or more albums is already saved in the current Spotify user’s “Your Music” library.
   * @param {string[]} albumIds The album IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   * of the returned array's elements correspond to the album ID in the request.
   * The boolean value of true indicates that the album is part of the user's library, otherwise false.
   * Not returned if a callback is given.
   */
  containsMySavedAlbums: function(albumIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/albums/contains')
      .withQueryParameters({
        ids: albumIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the current user's top artists based on calculated affinity.
   * @param {Object} [options] Options, being time_range, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of artists,
   *          otherwise an error. Not returned if a callback is given.
   */
  getMyTopArtists: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/top/artists')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the current user's top tracks based on calculated affinity.
   * @param {Object} [options] Options, being time_range, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
   *          otherwise an error. Not returned if a callback is given.
   */
  getMyTopTracks: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/top/tracks')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the Current User's Recently Played Tracks
   * @param {Object} [options] Options, being type, after, limit, before.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of play history objects,
   *          otherwise an error. Not returned if a callback is given. Note that the response will be empty
   *          in case the user has enabled private session.
   */
  getMyRecentlyPlayedTracks: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/recently-played')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Add track or episode to device queue
   * @param {string} [uri] uri of the track or episode to add
   * @param {Object} [options] Options, being device_id.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
   *          otherwise an error. Not returned if a callback is given.
   */
  addToQueue: function(uri, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/queue')
      .withQueryParameters(
        {
          uri: uri
        },
        options
      )
      .build()
      .execute(HttpManager.post, callback);
  },


  /** 
   * Get the Current User's Available Devices
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of device objects,
   *          otherwise an error. Not returned if a callback is given.
   */
  getMyDevices: function(callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/devices')
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the Current User's Currently Playing Track.
   * @param {Object} [options] Options, being market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
   *          otherwise an error. Not returned if a callback is given.
   */
  getMyCurrentPlayingTrack: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/currently-playing')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get Information About The User's Current Playback State
   * @param {Object} [options] Options, being market and additional_types.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into a paging object of tracks,
   *          otherwise an error. Not returned if a callback is given.
   */
  getMyCurrentPlaybackState: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Transfer a User's Playback
   * @param {string[]} [deviceIds] An _array_ containing a device ID on which playback should be started/transferred. 
   * (NOTE: The API is currently only supporting a single device ID.)
   * @param {Object} [options] Options, the only one being 'play'.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  transferMyPlayback: function(deviceIds, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(
        {
          device_ids: deviceIds,
        },
        options
      )
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Starts o Resumes the Current User's Playback
   * @param {Object} [options] Options, being device_id, context_uri, offset, uris, position_ms.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example play({context_uri: 'spotify:album:5ht7ItJgpBH7W6vJ5BqpPr'}).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  play: function(options, callback) {
    /*jshint camelcase: false */
    var _options = options || {};
    var queryParams = _options.device_id
      ? { device_id: _options.device_id }
      : null;
    var postData = {};
    ['context_uri', 'uris', 'offset', 'position_ms'].forEach(function(field) {
      if (field in _options) {
        postData[field] = _options[field];
      }
    });
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/play')
      .withQueryParameters(queryParams)
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(postData)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Pauses the Current User's Playback
   * @param {Object} [options] Options, being device_id. If left empty will target the user's currently active device.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example pause().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  pause: function(options, callback) {
    return (
      WebApiRequest.builder(this.getAccessToken())
        .withPath('/v1/me/player/pause')
        /*jshint camelcase: false */
        .withQueryParameters(
          options && options.device_id ? { device_id: options.device_id } : null
        )
        .withHeaders({ 'Content-Type': 'application/json' })
        .build()
        .execute(HttpManager.put, callback)
    );
  },

  /**
   * Skip the Current User's Playback To Previous Track
   * @param {Object} [options] Options, being device_id. If left empty will target the user's currently active device.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example skipToPrevious().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  skipToPrevious: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/previous')
      .withQueryParameters(
        options && options.device_id ? { device_id: options.device_id } : null
      )
      .build()
      .execute(HttpManager.post, callback);
  },

  /**
   * Skip the Current User's Playback To Next Track
   * @param {Object} [options] Options, being device_id. If left empty will target the user's currently active device.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example skipToNext().then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  skipToNext: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/next')
      .withQueryParameters(
        options && options.device_id ? { device_id: options.device_id } : null
      )
      .build()
      .execute(HttpManager.post, callback);
  },

  /**
   * Seeks to the given position in the user’s currently playing track.
   *
   * @param {number} positionMs The position in milliseconds to seek to. Must be a positive number.
   * @param {Object} options Options, being device_id. If left empty will target the user's currently active device.
   * @param {function(Object,Object)} callback An optional callback that receives 2 parameters. The first
   * one is the error object (null if no error), and the second is the value if the request succeeded.
   * @return {Object} Null if a callback is provided, a `Promise` object otherwise
   */
  seek: function(positionMs, options, callback) {
    var params = {
      /* jshint camelcase: false */
      position_ms: positionMs
    };
    if (options && 'device_id' in options) {
      /* jshint camelcase: false */
      params.device_id = options.device_id;
    }
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/seek')
      .withQueryParameters(params)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Set Repeat Mode On The Current User's Playback
   * @param {string} [state] State (track, context, or off)
   * @param {Object} [options] Options, being device_id. If left empty will target the user's currently active device.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example setRepeat('context', {}).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  setRepeat: function(state, options, callback) {
    var params = {
      state: state
    };
    if (options && 'device_id' in options) {
      /* jshint camelcase: false */
      params.device_id = options.device_id;
    }
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/repeat')
      .withQueryParameters(params)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Set Shuffle Mode On The Current User's Playback
   * @param {boolean} [state] State 
   * @param {Object} [options] Options, being device_id. If left empty will target the user's currently active device.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example setShuffle({state: 'false'}).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an empty response,
   *          otherwise an error. Not returned if a callback is given.
   */
  setShuffle: function(state, options, callback) {
    var params = {
      state: state
    };
    if (options && 'device_id' in options) {
      /* jshint camelcase: false */
      params.device_id = options.device_id;
    }
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/shuffle')
      .withQueryParameters(params)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Set the volume for the user’s current playback device.
   * @param {number} volumePercent The volume to set. Must be a value from 0 to 100.
   * @param {Object} options Options, being device_id. If left empty will target the user's currently active device.
   * @param {function(Object,Object)} callback An optional callback that receives 2 parameters. The first
   * one is the error object (null if no error), and the second is the value if the request succeeded.
   * @return {Object} Null if a callback is provided, a `Promise` object otherwise
   */
  setVolume: function(volumePercent, options, callback) {
    var params = {
      /* jshint camelcase: false */
      volume_percent: volumePercent
    };
    if (options && 'device_id' in options) {
      /* jshint camelcase: false */
      params.device_id = options.device_id;
    }
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/player/volume')
      .withQueryParameters(params)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Add the current user as a follower of one or more other Spotify users.
   * @param {string[]} userIds The IDs of the users to be followed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example followUsers(['thelinmichael', 'wizzler']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  followUsers: function(userIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: userIds.join(','),
        type: 'user'
      })
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Add the current user as a follower of one or more artists.
   * @param {string[]} artistIds The IDs of the artists to be followed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example followArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  followArtists: function(artistIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: artistIds.join(','),
        type: 'artist'
      })
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Remove the current user as a follower of one or more other Spotify users.
   * @param {string[]} userIds The IDs of the users to be unfollowed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example unfollowUsers(['thelinmichael', 'wizzler']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  unfollowUsers: function(userIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: userIds.join(','),
        type: 'user'
      })
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Remove the current user as a follower of one or more artists.
   * @param {string[]} artistIds The IDs of the artists to be unfollowed.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example unfollowArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
   * @returns {Promise|undefined} A promise that if successful, simply resolves to an empty object. If rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  unfollowArtists: function(artistIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following')
      .withQueryParameters({
        ids: artistIds.join(','),
        type: 'artist'
      })
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Check to see if the current user is following one or more other Spotify users.
   * @param {string[]} userIds The IDs of the users to check if are followed by the current user.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example isFollowingUsers(['thelinmichael', 'wizzler']).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   *          of the returned array's elements correspond to the users IDs in the request.
   *          The boolean value of true indicates that the user is following that user, otherwise is not.
   *          Not returned if a callback is given.
   */
  isFollowingUsers: function(userIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following/contains')
      .withQueryParameters({
        ids: userIds.join(','),
        type: 'user'
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the current user's followed artists.
   * @param {Object} [options] Options, being after and limit.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
   * album objects. Not returned if a callback is given.
   */
  getFollowedArtists: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following')
      .withQueryParameters(
        {
          type: 'artist'
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Check if users are following a playlist.
   * @param {string} userId The playlist's owner's user ID
   * @param {string} playlistId The playlist's ID
   * @param {String[]} User IDs of the following users
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns an array of booleans. If rejected,
   * it contains an error object. Not returned if a callback is given.
   */
  areFollowingPlaylist: function(userId, playlistId, followerIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath(
        '/v1/users/' +
          encodeURIComponent(userId) +
          '/playlists/' +
          playlistId +
          '/followers/contains'
      )
      .withQueryParameters({
        ids: followerIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Check to see if the current user is following one or more artists.
   * @param {string[]} artistIds The IDs of the artists to check if are followed by the current user.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example isFollowingArtists(['0LcJLqbBmaGUft1e9Mm8HV', '3gqv1kgivAc92KnUm4elKv']).then(...)
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   *          of the returned array's elements correspond to the artists IDs in the request.
   *          The boolean value of true indicates that the user is following that artist, otherwise is not.
   *          Not returned if a callback is given.
   */
  isFollowingArtists: function(artistIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/following/contains')
      .withQueryParameters({
        ids: artistIds.join(','),
        type: 'artist'
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve new releases
   * @param {Object} [options] Options, being country, limit and/or offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
   * album objects. Not returned if a callback is given.
   */
  getNewReleases: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/browse/new-releases')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve featured playlists
   * @param {Object} [options] Options, being country, locale, timestamp, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which contains
   * featured playlists. Not returned if a callback is given.
   */
  getFeaturedPlaylists: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/browse/featured-playlists')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve a list of categories used to tag items in Spotify (e.g. in the 'Browse' tab)
   * @param {Object} [options] Options, being country, locale, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object of categories.
   * Not returned if a callback is given.
   */
  getCategories: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/browse/categories')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve a category.
   * @param {string} categoryId The id of the category to retrieve.
   * @param {Object} [options] Options, being country, locale.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a category object.
   * Not returned if a callback is given.
   */
  getCategory: function(categoryId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/browse/categories/' + categoryId)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Retrieve playlists for a category.
   * @param {string} categoryId The id of the category to retrieve playlists for.
   * @param {Object} [options] Options, being country, limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to a paging object containing simple playlists.
   * Not returned if a callback is given.
   */
  getPlaylistsForCategory: function(categoryId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/browse/categories/' + categoryId + '/playlists')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get a show.
   * @param {string} showId The show's ID.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getShow('3Qm86XLflmIXVm1wcwkgDK').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the show. Not returned if a callback is given.
   */
  getShow: function(showId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
    .withPath('/v1/shows/' + showId)
    .withQueryParameters(options)
    .build()
    .execute(HttpManager.get, callback);
  },

  /**
   * Look up several shows.
   * @param {string[]} showIds The IDs of the shows.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getShows(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the shows. Not returned if a callback is given.
   */
  getShows: function(showIds, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/shows')
      .withQueryParameters(
        {
          ids: showIds.join(',')
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Check if one or more shows is already saved in the current Spotify user’s “Your Music” library.
   * @param {string[]} showIds The show IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves into an array of booleans. The order
   * of the returned array's elements correspond to the show ID in the request.
   * The boolean value of true indicates that the show is part of the user's library, otherwise false.
   * Not returned if a callback is given.
   */
  containsMySavedShows: function(showIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/shows/contains')
      .withQueryParameters({
        ids: showIds.join(',')
      })
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Remove an show from the authenticated user's Your Music library.
   * @param {string[]} showIds The show IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error.
   * Not returned if a callback is given.
   */
  removeFromMySavedShows: function(showIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/shows')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(showIds)
      .build()
      .execute(HttpManager.del, callback);
  },

  /**
   * Add a show from the authenticated user's Your Music library.
   * @param {string[]} showIds The show IDs
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful returns null, otherwise an error. Not returned if a callback is given.
   */
  addToMySavedShows: function(showIds, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/shows')
      .withHeaders({ 'Content-Type': 'application/json' })
      .withBodyParameters(showIds)
      .build()
      .execute(HttpManager.put, callback);
  },

  /**
   * Retrieve the shows that are saved to the authenticated users Your Music library.
   * @param {Object} [options] Options, being market, limit, and/or offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @returns {Promise|undefined} A promise that if successful, resolves to an object containing a paging object which in turn contains
   *          playlist show objects. Not returned if a callback is given.
   */
  getMySavedShows: function(options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/me/shows')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Get the episodes of an show.
   * @param showId the show's ID.
   * @options {Object} [options] The possible options, being limit, offset, and market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getShowEpisodes('41MnTivkwTO3UUJ8DrqEJJ', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *                    episodes in the album. The result is paginated. If the promise is rejected.
   *                    it contains an error object. Not returned if a callback is given.
   */
  getShowEpisodes: function(showId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/shows/' + showId + '/episodes')
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Search for a show.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchShows('Space Oddity', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchShows: function(query, options, callback) {
    return this.search(query, ['show'], options, callback);
  },

  /**
   * Search for an episode.
   * @param {string} query The search query.
   * @param {Object} [options] The possible options, e.g. limit, offset.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example searchEpisodes('Space Oddity', { limit : 5, offset : 1 }).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing the
   *          search results. The result is paginated. If the promise is rejected,
   *          it contains an error object. Not returned if a callback is given.
   */
  searchEpisodes: function(query, options, callback) {
    return this.search(query, ['episode'], options, callback);
  },

 /**
   * Look up an episode.
   * @param {string} episodeId The episode's ID.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getEpisode('3Qm86XLflmIXVm1wcwkgDK').then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the episode. Not returned if a callback is given.
   */
  getEpisode: function(episodeId, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/episodes/' + episodeId)
      .withQueryParameters(options)
      .build()
      .execute(HttpManager.get, callback);
  },

  /**
   * Look up several episodes.
   * @param {string[]} episodeIds The IDs of the episodes.
   * @param {Object} [options] The possible options, currently only market.
   * @param {requestCallback} [callback] Optional callback method to be called instead of the promise.
   * @example getEpisodes(['0oSGxfWSnnOXhD2fKuz2Gy', '3dBVyJ7JuOMt4GE9607Qin']).then(...)
   * @returns {Promise|undefined} A promise that if successful, returns an object containing information
   *          about the episodes. Not returned if a callback is given.
   */
  getEpisodes: function(episodeIds, options, callback) {
    return WebApiRequest.builder(this.getAccessToken())
      .withPath('/v1/episodes')
      .withQueryParameters(
        {
          ids: episodeIds.join(',')
        },
        options
      )
      .build()
      .execute(HttpManager.get, callback);
  },
};

SpotifyWebApi._addMethods = function(methods) {
  for (var i in methods) {
    if (methods.hasOwnProperty(i)) {
      this.prototype[i] = methods[i];
    }
  }
};

module.exports = SpotifyWebApi;

},{"./authentication-request":18,"./http-manager":21,"./webapi-request":24}],24:[function(require,module,exports){
'use strict';

var Request = require('./base-request');

var DEFAULT_HOST = 'api.spotify.com',
  DEFAULT_PORT = 443,
  DEFAULT_SCHEME = 'https';

module.exports.builder = function(accessToken) {
  return Request.builder()
    .withHost(DEFAULT_HOST)
    .withPort(DEFAULT_PORT)
    .withScheme(DEFAULT_SCHEME)
    .withAuth(accessToken);
};

},{"./base-request":19}],25:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function Agent() {
  this._defaults = [];
}

['use', 'on', 'once', 'set', 'query', 'type', 'accept', 'auth', 'withCredentials', 'sortQuery', 'retry', 'ok', 'redirects', 'timeout', 'buffer', 'serialize', 'parse', 'ca', 'key', 'pfx', 'cert', 'disableTLSCerts'].forEach(function (fn) {
  // Default setting for all requests from this agent
  Agent.prototype[fn] = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    this._defaults.push({
      fn: fn,
      args: args
    });

    return this;
  };
});

Agent.prototype._setDefaults = function (req) {
  this._defaults.forEach(function (def) {
    req[def.fn].apply(req, _toConsumableArray(def.args));
  });
};

module.exports = Agent;

},{}],26:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Root reference for iframes.
 */
var root;

if (typeof window !== 'undefined') {
  // Browser window
  root = window;
} else if (typeof self === 'undefined') {
  // Other environments
  console.warn('Using browser-only version of superagent in non-browser environment');
  root = void 0;
} else {
  // Web Worker
  root = self;
}

var Emitter = require('component-emitter');

var safeStringify = require('fast-safe-stringify');

var qs = require('qs');

var RequestBase = require('./request-base');

var isObject = require('./is-object');

var ResponseBase = require('./response-base');

var Agent = require('./agent-base');
/**
 * Noop.
 */


function noop() {}
/**
 * Expose `request`.
 */


module.exports = function (method, url) {
  // callback
  if (typeof url === 'function') {
    return new exports.Request('GET', method).end(url);
  } // url first


  if (arguments.length === 1) {
    return new exports.Request('GET', method);
  }

  return new exports.Request(method, url);
};

exports = module.exports;
var request = exports;
exports.Request = Request;
/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest && (!root.location || root.location.protocol !== 'file:' || !root.ActiveXObject)) {
    return new XMLHttpRequest();
  }

  try {
    return new ActiveXObject('Microsoft.XMLHTTP');
  } catch (_unused) {}

  try {
    return new ActiveXObject('Msxml2.XMLHTTP.6.0');
  } catch (_unused2) {}

  try {
    return new ActiveXObject('Msxml2.XMLHTTP.3.0');
  } catch (_unused3) {}

  try {
    return new ActiveXObject('Msxml2.XMLHTTP');
  } catch (_unused4) {}

  throw new Error('Browser-only version of superagent could not find XHR');
};
/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */


var trim = ''.trim ? function (s) {
  return s.trim();
} : function (s) {
  return s.replace(/(^\s*|\s*$)/g, '');
};
/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) pushEncodedKeyValuePair(pairs, key, obj[key]);
  }

  return pairs.join('&');
}
/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */


function pushEncodedKeyValuePair(pairs, key, val) {
  if (val === undefined) return;

  if (val === null) {
    pairs.push(encodeURI(key));
    return;
  }

  if (Array.isArray(val)) {
    val.forEach(function (v) {
      pushEncodedKeyValuePair(pairs, key, v);
    });
  } else if (isObject(val)) {
    for (var subkey in val) {
      if (Object.prototype.hasOwnProperty.call(val, subkey)) pushEncodedKeyValuePair(pairs, "".concat(key, "[").concat(subkey, "]"), val[subkey]);
    }
  } else {
    pairs.push(encodeURI(key) + '=' + encodeURIComponent(val));
  }
}
/**
 * Expose serialization method.
 */


request.serializeObject = serialize;
/**
 * Parse the given x-www-form-urlencoded `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var pair;
  var pos;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    pos = pair.indexOf('=');

    if (pos === -1) {
      obj[decodeURIComponent(pair)] = '';
    } else {
      obj[decodeURIComponent(pair.slice(0, pos))] = decodeURIComponent(pair.slice(pos + 1));
    }
  }

  return obj;
}
/**
 * Expose parser.
 */


request.parseString = parseString;
/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'text/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  form: 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};
/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

request.serialize = {
  'application/x-www-form-urlencoded': qs.stringify,
  'application/json': safeStringify
};
/**
 * Default parsers.
 *
 *     superagent.parse['application/xml'] = function(str){
 *       return { object parsed from str };
 *     };
 *
 */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};
/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');

    if (index === -1) {
      // could be empty line, just skip it
      continue;
    }

    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}
/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */


function isJSON(mime) {
  // should match /json or +json
  // but not /json-seq
  return /[/+]json($|[^-\w])/i.test(mime);
}
/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */


function Response(req) {
  this.req = req;
  this.xhr = this.req.xhr; // responseText is accessible only if responseType is '' or 'text' and on older browsers

  this.text = this.req.method !== 'HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text') || typeof this.xhr.responseType === 'undefined' ? this.xhr.responseText : null;
  this.statusText = this.req.xhr.statusText;
  var status = this.xhr.status; // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request

  if (status === 1223) {
    status = 204;
  }

  this._setStatusProperties(status);

  this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  this.header = this.headers; // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.

  this.header['content-type'] = this.xhr.getResponseHeader('content-type');

  this._setHeaderProperties(this.header);

  if (this.text === null && req._responseType) {
    this.body = this.xhr.response;
  } else {
    this.body = this.req.method === 'HEAD' ? null : this._parseBody(this.text ? this.text : this.xhr.response);
  }
} // eslint-disable-next-line new-cap


ResponseBase(Response.prototype);
/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype._parseBody = function (str) {
  var parse = request.parse[this.type];

  if (this.req._parser) {
    return this.req._parser(this, str);
  }

  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }

  return parse && str && (str.length > 0 || str instanceof Object) ? parse(str) : null;
};
/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */


Response.prototype.toError = function () {
  var req = this.req;
  var method = req.method;
  var url = req.url;
  var msg = "cannot ".concat(method, " ").concat(url, " (").concat(this.status, ")");
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;
  return err;
};
/**
 * Expose `Response`.
 */


request.Response = Response;
/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case

  this._header = {}; // coerces header names to lowercase

  this.on('end', function () {
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch (err_) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = err_; // issue #675: return the raw response if the response parsing fails

      if (self.xhr) {
        // ie9 doesn't have 'response' property
        err.rawResponse = typeof self.xhr.responseType === 'undefined' ? self.xhr.responseText : self.xhr.response; // issue #876: return the http status code if the response parsing fails

        err.status = self.xhr.status ? self.xhr.status : null;
        err.statusCode = err.status; // backwards-compat only
      } else {
        err.rawResponse = null;
        err.status = null;
      }

      return self.callback(err);
    }

    self.emit('response', res);
    var new_err;

    try {
      if (!self._isResponseOK(res)) {
        new_err = new Error(res.statusText || res.text || 'Unsuccessful HTTP response');
      }
    } catch (err_) {
      new_err = err_; // ok() callback can throw
    } // #1000 don't catch errors from the callback to avoid double calling it


    if (new_err) {
      new_err.original = err;
      new_err.response = res;
      new_err.status = res.status;
      self.callback(new_err, res);
    } else {
      self.callback(null, res);
    }
  });
}
/**
 * Mixin `Emitter` and `RequestBase`.
 */
// eslint-disable-next-line new-cap


Emitter(Request.prototype); // eslint-disable-next-line new-cap

RequestBase(Request.prototype);
/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function (type) {
  this.set('Content-Type', request.types[type] || type);
  return this;
};
/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.accept = function (type) {
  this.set('Accept', request.types[type] || type);
  return this;
};
/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} [pass] optional in case of using 'bearer' as type
 * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.auth = function (user, pass, options) {
  if (arguments.length === 1) pass = '';

  if (_typeof(pass) === 'object' && pass !== null) {
    // pass is optional and can be replaced with options
    options = pass;
    pass = '';
  }

  if (!options) {
    options = {
      type: typeof btoa === 'function' ? 'basic' : 'auto'
    };
  }

  var encoder = function encoder(string) {
    if (typeof btoa === 'function') {
      return btoa(string);
    }

    throw new Error('Cannot use basic auth, btoa is not a function');
  };

  return this._auth(user, pass, options, encoder);
};
/**
 * Add query-string `val`.
 *
 * Examples:
 *
 *   request.get('/shoes')
 *     .query('size=10')
 *     .query({ color: 'blue' })
 *
 * @param {Object|String} val
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.query = function (val) {
  if (typeof val !== 'string') val = serialize(val);
  if (val) this._query.push(val);
  return this;
};
/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `options` (or filename).
 *
 * ``` js
 * request.post('/upload')
 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String|Object} options
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.attach = function (field, file, options) {
  if (file) {
    if (this._data) {
      throw new Error("superagent can't mix .send() and .attach()");
    }

    this._getFormData().append(field, file, options || file.name);
  }

  return this;
};

Request.prototype._getFormData = function () {
  if (!this._formData) {
    this._formData = new root.FormData();
  }

  return this._formData;
};
/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */


Request.prototype.callback = function (err, res) {
  if (this._shouldRetry(err, res)) {
    return this._retry();
  }

  var fn = this._callback;
  this.clearTimeout();

  if (err) {
    if (this._maxRetries) err.retries = this._retries - 1;
    this.emit('error', err);
  }

  fn(err, res);
};
/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */


Request.prototype.crossDomainError = function () {
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;
  err.status = this.status;
  err.method = this.method;
  err.url = this.url;
  this.callback(err);
}; // This only warns, because the request is still likely to work


Request.prototype.agent = function () {
  console.warn('This is not supported in browser version of superagent');
  return this;
};

Request.prototype.ca = Request.prototype.agent;
Request.prototype.buffer = Request.prototype.ca; // This throws, because it can't send/receive data as expected

Request.prototype.write = function () {
  throw new Error('Streaming is not supported in browser version of superagent');
};

Request.prototype.pipe = Request.prototype.write;
/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * @param {Object} obj host object
 * @return {Boolean} is a host object
 * @api private
 */

Request.prototype._isHost = function (obj) {
  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
  return obj && _typeof(obj) === 'object' && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
};
/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */


Request.prototype.end = function (fn) {
  if (this._endCalled) {
    console.warn('Warning: .end() was called twice. This is not supported in superagent');
  }

  this._endCalled = true; // store callback

  this._callback = fn || noop; // querystring

  this._finalizeQueryString();

  this._end();
};

Request.prototype._setUploadTimeout = function () {
  var self = this; // upload timeout it's wokrs only if deadline timeout is off

  if (this._uploadTimeout && !this._uploadTimeoutTimer) {
    this._uploadTimeoutTimer = setTimeout(function () {
      self._timeoutError('Upload timeout of ', self._uploadTimeout, 'ETIMEDOUT');
    }, this._uploadTimeout);
  }
}; // eslint-disable-next-line complexity


Request.prototype._end = function () {
  if (this._aborted) return this.callback(new Error('The request has been aborted even before .end() was called'));
  var self = this;
  this.xhr = request.getXHR();
  var xhr = this.xhr;
  var data = this._formData || this._data;

  this._setTimeouts(); // state change


  xhr.onreadystatechange = function () {
    var readyState = xhr.readyState;

    if (readyState >= 2 && self._responseTimeoutTimer) {
      clearTimeout(self._responseTimeoutTimer);
    }

    if (readyState !== 4) {
      return;
    } // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"


    var status;

    try {
      status = xhr.status;
    } catch (_unused5) {
      status = 0;
    }

    if (!status) {
      if (self.timedout || self._aborted) return;
      return self.crossDomainError();
    }

    self.emit('end');
  }; // progress


  var handleProgress = function handleProgress(direction, e) {
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;

      if (e.percent === 100) {
        clearTimeout(self._uploadTimeoutTimer);
      }
    }

    e.direction = direction;
    self.emit('progress', e);
  };

  if (this.hasListeners('progress')) {
    try {
      xhr.addEventListener('progress', handleProgress.bind(null, 'download'));

      if (xhr.upload) {
        xhr.upload.addEventListener('progress', handleProgress.bind(null, 'upload'));
      }
    } catch (_unused6) {// Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
      // Reported here:
      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
    }
  }

  if (xhr.upload) {
    this._setUploadTimeout();
  } // initiate request


  try {
    if (this.username && this.password) {
      xhr.open(this.method, this.url, true, this.username, this.password);
    } else {
      xhr.open(this.method, this.url, true);
    }
  } catch (err) {
    // see #1149
    return this.callback(err);
  } // CORS


  if (this._withCredentials) xhr.withCredentials = true; // body

  if (!this._formData && this.method !== 'GET' && this.method !== 'HEAD' && typeof data !== 'string' && !this._isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];

    var _serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];

    if (!_serialize && isJSON(contentType)) {
      _serialize = request.serialize['application/json'];
    }

    if (_serialize) data = _serialize(data);
  } // set header fields


  for (var field in this.header) {
    if (this.header[field] === null) continue;
    if (Object.prototype.hasOwnProperty.call(this.header, field)) xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  } // send stuff


  this.emit('request', this); // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined

  xhr.send(typeof data === 'undefined' ? null : data);
};

request.agent = function () {
  return new Agent();
};

['GET', 'POST', 'OPTIONS', 'PATCH', 'PUT', 'DELETE'].forEach(function (method) {
  Agent.prototype[method.toLowerCase()] = function (url, fn) {
    var req = new request.Request(method, url);

    this._setDefaults(req);

    if (fn) {
      req.end(fn);
    }

    return req;
  };
});
Agent.prototype.del = Agent.prototype.delete;
/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.get = function (url, data, fn) {
  var req = request('GET', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.head = function (url, data, fn) {
  var req = request('HEAD', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * OPTIONS query to `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.options = function (url, data, fn) {
  var req = request('OPTIONS', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * DELETE `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


function del(url, data, fn) {
  var req = request('DELETE', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
}

request.del = del;
request.delete = del;
/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.patch = function (url, data, fn) {
  var req = request('PATCH', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.post = function (url, data, fn) {
  var req = request('POST', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};
/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */


request.put = function (url, data, fn) {
  var req = request('PUT', url);

  if (typeof data === 'function') {
    fn = data;
    data = null;
  }

  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

},{"./agent-base":25,"./is-object":27,"./request-base":28,"./response-base":29,"component-emitter":3,"fast-safe-stringify":4,"qs":13}],27:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
function isObject(obj) {
  return obj !== null && _typeof(obj) === 'object';
}

module.exports = isObject;

},{}],28:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = require('./is-object');
/**
 * Expose `RequestBase`.
 */


module.exports = RequestBase;
/**
 * Initialize a new `RequestBase`.
 *
 * @api public
 */

function RequestBase(object) {
  if (object) return mixin(object);
}
/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */


function mixin(object) {
  for (var key in RequestBase.prototype) {
    if (Object.prototype.hasOwnProperty.call(RequestBase.prototype, key)) object[key] = RequestBase.prototype[key];
  }

  return object;
}
/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.clearTimeout = function () {
  clearTimeout(this._timer);
  clearTimeout(this._responseTimeoutTimer);
  clearTimeout(this._uploadTimeoutTimer);
  delete this._timer;
  delete this._responseTimeoutTimer;
  delete this._uploadTimeoutTimer;
  return this;
};
/**
 * Override default response body parser
 *
 * This function will be called to convert incoming data into request.body
 *
 * @param {Function}
 * @api public
 */


RequestBase.prototype.parse = function (fn) {
  this._parser = fn;
  return this;
};
/**
 * Set format of binary response body.
 * In browser valid formats are 'blob' and 'arraybuffer',
 * which return Blob and ArrayBuffer, respectively.
 *
 * In Node all values result in Buffer.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.responseType = function (value) {
  this._responseType = value;
  return this;
};
/**
 * Override default request body serializer
 *
 * This function will be called to convert data set via .send or .attach into payload to send
 *
 * @param {Function}
 * @api public
 */


RequestBase.prototype.serialize = function (fn) {
  this._serializer = fn;
  return this;
};
/**
 * Set timeouts.
 *
 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
 * - upload is the time  since last bit of data was sent or received. This timeout works only if deadline timeout is off
 *
 * Value of 0 or false means no timeout.
 *
 * @param {Number|Object} ms or {response, deadline}
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.timeout = function (options) {
  if (!options || _typeof(options) !== 'object') {
    this._timeout = options;
    this._responseTimeout = 0;
    this._uploadTimeout = 0;
    return this;
  }

  for (var option in options) {
    if (Object.prototype.hasOwnProperty.call(options, option)) {
      switch (option) {
        case 'deadline':
          this._timeout = options.deadline;
          break;

        case 'response':
          this._responseTimeout = options.response;
          break;

        case 'upload':
          this._uploadTimeout = options.upload;
          break;

        default:
          console.warn('Unknown timeout option', option);
      }
    }
  }

  return this;
};
/**
 * Set number of retry attempts on error.
 *
 * Failed requests will be retried 'count' times if timeout or err.code >= 500.
 *
 * @param {Number} count
 * @param {Function} [fn]
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.retry = function (count, fn) {
  // Default to 1 if no count passed or true
  if (arguments.length === 0 || count === true) count = 1;
  if (count <= 0) count = 0;
  this._maxRetries = count;
  this._retries = 0;
  this._retryCallback = fn;
  return this;
}; //
// NOTE: we do not include ESOCKETTIMEDOUT because that is from `request` package
//       <https://github.com/sindresorhus/got/pull/537>
//
// NOTE: we do not include EADDRINFO because it was removed from libuv in 2014
//       <https://github.com/libuv/libuv/commit/02e1ebd40b807be5af46343ea873331b2ee4e9c1>
//       <https://github.com/request/request/search?q=ESOCKETTIMEDOUT&unscoped_q=ESOCKETTIMEDOUT>
//
//
// TODO: expose these as configurable defaults
//


var ERROR_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'EADDRINUSE', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND', 'ENETUNREACH', 'EAI_AGAIN']);
var STATUS_CODES = new Set([408, 413, 429, 500, 502, 503, 504, 521, 522, 524]); // TODO: we would need to make this easily configurable before adding it in (e.g. some might want to add POST)
// const METHODS = new Set(['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE']);

/**
 * Determine if a request should be retried.
 * (Inspired by https://github.com/sindresorhus/got#retry)
 *
 * @param {Error} err an error
 * @param {Response} [res] response
 * @returns {Boolean} if segment should be retried
 */

RequestBase.prototype._shouldRetry = function (err, res) {
  if (!this._maxRetries || this._retries++ >= this._maxRetries) {
    return false;
  }

  if (this._retryCallback) {
    try {
      var override = this._retryCallback(err, res);

      if (override === true) return true;
      if (override === false) return false; // undefined falls back to defaults
    } catch (err_) {
      console.error(err_);
    }
  } // TODO: we would need to make this easily configurable before adding it in (e.g. some might want to add POST)

  /*
  if (
    this.req &&
    this.req.method &&
    !METHODS.has(this.req.method.toUpperCase())
  )
    return false;
  */


  if (res && res.status && STATUS_CODES.has(res.status)) return true;

  if (err) {
    if (err.code && ERROR_CODES.has(err.code)) return true; // Superagent timeout

    if (err.timeout && err.code === 'ECONNABORTED') return true;
    if (err.crossDomain) return true;
  }

  return false;
};
/**
 * Retry request
 *
 * @return {Request} for chaining
 * @api private
 */


RequestBase.prototype._retry = function () {
  this.clearTimeout(); // node

  if (this.req) {
    this.req = null;
    this.req = this.request();
  }

  this._aborted = false;
  this.timedout = false;
  this.timedoutError = null;
  return this._end();
};
/**
 * Promise support
 *
 * @param {Function} resolve
 * @param {Function} [reject]
 * @return {Request}
 */


RequestBase.prototype.then = function (resolve, reject) {
  var _this = this;

  if (!this._fullfilledPromise) {
    var self = this;

    if (this._endCalled) {
      console.warn('Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises');
    }

    this._fullfilledPromise = new Promise(function (resolve, reject) {
      self.on('abort', function () {
        if (_this._maxRetries && _this._maxRetries > _this._retries) {
          return;
        }

        if (_this.timedout && _this.timedoutError) {
          reject(_this.timedoutError);
          return;
        }

        var err = new Error('Aborted');
        err.code = 'ABORTED';
        err.status = _this.status;
        err.method = _this.method;
        err.url = _this.url;
        reject(err);
      });
      self.end(function (err, res) {
        if (err) reject(err);else resolve(res);
      });
    });
  }

  return this._fullfilledPromise.then(resolve, reject);
};

RequestBase.prototype.catch = function (cb) {
  return this.then(undefined, cb);
};
/**
 * Allow for extension
 */


RequestBase.prototype.use = function (fn) {
  fn(this);
  return this;
};

RequestBase.prototype.ok = function (cb) {
  if (typeof cb !== 'function') throw new Error('Callback required');
  this._okCallback = cb;
  return this;
};

RequestBase.prototype._isResponseOK = function (res) {
  if (!res) {
    return false;
  }

  if (this._okCallback) {
    return this._okCallback(res);
  }

  return res.status >= 200 && res.status < 300;
};
/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */


RequestBase.prototype.get = function (field) {
  return this._header[field.toLowerCase()];
};
/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */


RequestBase.prototype.getHeader = RequestBase.prototype.get;
/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.set = function (field, value) {
  if (isObject(field)) {
    for (var key in field) {
      if (Object.prototype.hasOwnProperty.call(field, key)) this.set(key, field[key]);
    }

    return this;
  }

  this._header[field.toLowerCase()] = value;
  this.header[field] = value;
  return this;
};
/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field field name
 */


RequestBase.prototype.unset = function (field) {
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};
/**
 * Write the field `name` and `val`, or multiple fields with one object
 * for "multipart/form-data" request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 *
 * request.post('/upload')
 *   .field({ foo: 'bar', baz: 'qux' })
 *   .end(callback);
 * ```
 *
 * @param {String|Object} name name of field
 * @param {String|Blob|File|Buffer|fs.ReadStream} val value of field
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.field = function (name, value) {
  // name should be either a string or an object.
  if (name === null || undefined === name) {
    throw new Error('.field(name, val) name can not be empty');
  }

  if (this._data) {
    throw new Error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObject(name)) {
    for (var key in name) {
      if (Object.prototype.hasOwnProperty.call(name, key)) this.field(key, name[key]);
    }

    return this;
  }

  if (Array.isArray(value)) {
    for (var i in value) {
      if (Object.prototype.hasOwnProperty.call(value, i)) this.field(name, value[i]);
    }

    return this;
  } // val should be defined now


  if (value === null || undefined === value) {
    throw new Error('.field(name, val) val can not be empty');
  }

  if (typeof value === 'boolean') {
    value = String(value);
  }

  this._getFormData().append(name, value);

  return this;
};
/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request} request
 * @api public
 */


RequestBase.prototype.abort = function () {
  if (this._aborted) {
    return this;
  }

  this._aborted = true;
  if (this.xhr) this.xhr.abort(); // browser

  if (this.req) this.req.abort(); // node

  this.clearTimeout();
  this.emit('abort');
  return this;
};

RequestBase.prototype._auth = function (user, pass, options, base64Encoder) {
  switch (options.type) {
    case 'basic':
      this.set('Authorization', "Basic ".concat(base64Encoder("".concat(user, ":").concat(pass))));
      break;

    case 'auto':
      this.username = user;
      this.password = pass;
      break;

    case 'bearer':
      // usage would be .auth(accessToken, { type: 'bearer' })
      this.set('Authorization', "Bearer ".concat(user));
      break;

    default:
      break;
  }

  return this;
};
/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */


RequestBase.prototype.withCredentials = function (on) {
  // This is browser-only functionality. Node side is no-op.
  if (on === undefined) on = true;
  this._withCredentials = on;
  return this;
};
/**
 * Set the max redirects to `n`. Does nothing in browser XHR implementation.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.redirects = function (n) {
  this._maxRedirects = n;
  return this;
};
/**
 * Maximum size of buffered response body, in bytes. Counts uncompressed size.
 * Default 200MB.
 *
 * @param {Number} n number of bytes
 * @return {Request} for chaining
 */


RequestBase.prototype.maxResponseSize = function (n) {
  if (typeof n !== 'number') {
    throw new TypeError('Invalid argument');
  }

  this._maxResponseSize = n;
  return this;
};
/**
 * Convert to a plain javascript object (not JSON string) of scalar properties.
 * Note as this method is designed to return a useful non-this value,
 * it cannot be chained.
 *
 * @return {Object} describing method, url, and data of this request
 * @api public
 */


RequestBase.prototype.toJSON = function () {
  return {
    method: this.method,
    url: this.url,
    data: this._data,
    headers: this._header
  };
};
/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
 *      request.post('/user')
 *        .send('name=tobi')
 *        .send('species=ferret')
 *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */
// eslint-disable-next-line complexity


RequestBase.prototype.send = function (data) {
  var isObject_ = isObject(data);
  var type = this._header['content-type'];

  if (this._formData) {
    throw new Error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObject_ && !this._data) {
    if (Array.isArray(data)) {
      this._data = [];
    } else if (!this._isHost(data)) {
      this._data = {};
    }
  } else if (data && this._data && this._isHost(this._data)) {
    throw new Error("Can't merge these send calls");
  } // merge


  if (isObject_ && isObject(this._data)) {
    for (var key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) this._data[key] = data[key];
    }
  } else if (typeof data === 'string') {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = this._header['content-type'];
    if (type) type = type.toLowerCase().trim();

    if (type === 'application/x-www-form-urlencoded') {
      this._data = this._data ? "".concat(this._data, "&").concat(data) : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!isObject_ || this._isHost(data)) {
    return this;
  } // default to json


  if (!type) this.type('json');
  return this;
};
/**
 * Sort `querystring` by the sort function
 *
 *
 * Examples:
 *
 *       // default order
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery()
 *         .end(callback)
 *
 *       // customized sort function
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery(function(a, b){
 *           return a.length - b.length;
 *         })
 *         .end(callback)
 *
 *
 * @param {Function} sort
 * @return {Request} for chaining
 * @api public
 */


RequestBase.prototype.sortQuery = function (sort) {
  // _sort default to true but otherwise can be a function or boolean
  this._sort = typeof sort === 'undefined' ? true : sort;
  return this;
};
/**
 * Compose querystring to append to req.url
 *
 * @api private
 */


RequestBase.prototype._finalizeQueryString = function () {
  var query = this._query.join('&');

  if (query) {
    this.url += (this.url.includes('?') ? '&' : '?') + query;
  }

  this._query.length = 0; // Makes the call idempotent

  if (this._sort) {
    var index = this.url.indexOf('?');

    if (index >= 0) {
      var queryArray = this.url.slice(index + 1).split('&');

      if (typeof this._sort === 'function') {
        queryArray.sort(this._sort);
      } else {
        queryArray.sort();
      }

      this.url = this.url.slice(0, index) + '?' + queryArray.join('&');
    }
  }
}; // For backwards compat only


RequestBase.prototype._appendQueryString = function () {
  console.warn('Unsupported');
};
/**
 * Invoke callback with timeout error.
 *
 * @api private
 */


RequestBase.prototype._timeoutError = function (reason, timeout, errno) {
  if (this._aborted) {
    return;
  }

  var err = new Error("".concat(reason + timeout, "ms exceeded"));
  err.timeout = timeout;
  err.code = 'ECONNABORTED';
  err.errno = errno;
  this.timedout = true;
  this.timedoutError = err;
  this.abort();
  this.callback(err);
};

RequestBase.prototype._setTimeouts = function () {
  var self = this; // deadline

  if (this._timeout && !this._timer) {
    this._timer = setTimeout(function () {
      self._timeoutError('Timeout of ', self._timeout, 'ETIME');
    }, this._timeout);
  } // response timeout


  if (this._responseTimeout && !this._responseTimeoutTimer) {
    this._responseTimeoutTimer = setTimeout(function () {
      self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
    }, this._responseTimeout);
  }
};

},{"./is-object":27}],29:[function(require,module,exports){
"use strict";

/**
 * Module dependencies.
 */
var utils = require('./utils');
/**
 * Expose `ResponseBase`.
 */


module.exports = ResponseBase;
/**
 * Initialize a new `ResponseBase`.
 *
 * @api public
 */

function ResponseBase(obj) {
  if (obj) return mixin(obj);
}
/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */


function mixin(obj) {
  for (var key in ResponseBase.prototype) {
    if (Object.prototype.hasOwnProperty.call(ResponseBase.prototype, key)) obj[key] = ResponseBase.prototype[key];
  }

  return obj;
}
/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */


ResponseBase.prototype.get = function (field) {
  return this.header[field.toLowerCase()];
};
/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */


ResponseBase.prototype._setHeaderProperties = function (header) {
  // TODO: moar!
  // TODO: make this a util
  // content-type
  var ct = header['content-type'] || '';
  this.type = utils.type(ct); // params

  var params = utils.params(ct);

  for (var key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) this[key] = params[key];
  }

  this.links = {}; // links

  try {
    if (header.link) {
      this.links = utils.parseLinks(header.link);
    }
  } catch (_unused) {// ignore
  }
};
/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */


ResponseBase.prototype._setStatusProperties = function (status) {
  var type = status / 100 | 0; // status / class

  this.statusCode = status;
  this.status = this.statusCode;
  this.statusType = type; // basics

  this.info = type === 1;
  this.ok = type === 2;
  this.redirect = type === 3;
  this.clientError = type === 4;
  this.serverError = type === 5;
  this.error = type === 4 || type === 5 ? this.toError() : false; // sugar

  this.created = status === 201;
  this.accepted = status === 202;
  this.noContent = status === 204;
  this.badRequest = status === 400;
  this.unauthorized = status === 401;
  this.notAcceptable = status === 406;
  this.forbidden = status === 403;
  this.notFound = status === 404;
  this.unprocessableEntity = status === 422;
};

},{"./utils":30}],30:[function(require,module,exports){
"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */
exports.type = function (str) {
  return str.split(/ *; */).shift();
};
/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */


exports.params = function (val) {
  var obj = {};

  var _iterator = _createForOfIteratorHelper(val.split(/ *; */)),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var str = _step.value;
      var parts = str.split(/ *= */);
      var key = parts.shift();

      var _val = parts.shift();

      if (key && _val) obj[key] = _val;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  return obj;
};
/**
 * Parse Link header fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */


exports.parseLinks = function (val) {
  var obj = {};

  var _iterator2 = _createForOfIteratorHelper(val.split(/ *, */)),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var str = _step2.value;
      var parts = str.split(/ *; */);
      var url = parts[0].slice(1, -1);
      var rel = parts[1].split(/ *= */)[1].slice(1, -1);
      obj[rel] = url;
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  return obj;
};
/**
 * Strip content related fields from `header`.
 *
 * @param {Object} header
 * @return {Object} header
 * @api private
 */


exports.cleanHeader = function (header, changesOrigin) {
  delete header['content-type'];
  delete header['content-length'];
  delete header['transfer-encoding'];
  delete header.host; // secuirty

  if (changesOrigin) {
    delete header.authorization;
    delete header.cookie;
  }

  return header;
};

},{}],31:[function(require,module,exports){
var SpotifyWebApi = require("spotify-web-api-node");

var spotifyApi = new SpotifyWebApi({
  clientId: "413809fc6a6a4d4aadff06f7a9176b94",
  clientSecret: "58ac47fad3784cf193becfd7b99bcc9a",
});

// spotifyApi.setAccessToken(
//   "BQCsyXTRLxfc1EXsQiuZcJaoYgmCYXdZNQaqQBPDpEBjVuqglSgg57-BHzN8v1B2D1EuzPWMkPQfj5iGFRbmMnE_ltqEjqiHgkSknZP1mctVdi7EVED5xYM7hRiSPflpfU0Eo3rMB27QXL_019eU"
// );

window.onload = () => {
  $("#sendbutton").click(() => {
    var sMsg = document.getElementById("s-msg");
    sMsg.innerHTML = "Loading image...";
    imagebox = $("#imagebox");
    input = $("#imageinput")[0];
    if (input.files && input.files[0]) {
      let formData = new FormData();
      formData.append("image", input.files[0]);
      $.ajax({
        url: "http://localhost:5000/test", // fix this to your liking
        type: "POST",
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        error: function (data) {
          console.log("upload error", data);
          console.log(data.getAllResponseHeaders());
        },
        success: function (data) {
          sMsg.innerHTML =
            "Image uploaded successfully! Click below to get songs.";
          //   bytestring = data["status"];
          //   image = bytestring.split("'")[1];
          //   imagebox.attr("ng-src", "data:image/jpeg;base64," + image);
          
          getEmotion(); // call backend and detect emotion from image
        },
      });
    }
  });
  const limit = 5;
  // make maximum 5 selectable checkboxes, need to uncheck to keep checking
  $("input.gnre").on("change", function (evt) {
    if ($(this).siblings(":checked").length >= limit) {
      this.checked = false;
    }
  });
  $("#send-tst").click(() => {
    // check token input if given: set access token and continue, if not: alert
    var tk = document.getElementById("token").value;
    if (tk == null || tk == "") {
      alert("Give an access token");
    } else {
      spotifyApi.setAccessToken(tk);

      // get marked genres and put them inside array
      var genres = [];
      var markedCheckbox = document.getElementsByClassName("gnre");
      for (var checkbox of markedCheckbox) {
        if (checkbox.checked) {
          genres.push(checkbox.name);
        }
      }
      // check marked genres, if none marked: alert, else check number of songs selected and continue
      if (!genres.length) {
        alert("Select at least one genre");
      } else {
        var numSongs = document.getElementById("num").value;
        // getEmotion(numSongs);
        recm(numSongs, genres);
      }
    }
  });
};

function getEmotion() {
  $.ajax({
    url: "http://localhost:5000/emotion",
    type: "GET",
    contentType: "application/json",
  }).done(function (data) {
    var pred = Object.values(data);
    console.log(pred[0]);
    // recm(numSongs, pred);
    var emPred = document.getElementById("em-pred");
    emPred.innerHTML = pred;
  });
}

function recm(numSongs, genres) {
  var emotion = document.getElementById("em-pred").innerHTML;
  if (emotion == "Angry") {
    t_energy = 0.8;
    t_mode = 0;
    t_valence = 0.3;
    t_tempo = 100;
    // genres = ["garage", "heavy-metal", "metal", "punk", "punk-rock"];
  } else if (emotion == "Disgust") {
    t_energy = 0.8;
    t_mode = Math.round(Math.random());
    if (t_mode == 1) {
      t_valence = 0.65;
    } else {
      (t_valence = 0), 2;
    }
    t_tempo = 110;
    // genres = ["dance", "electronic", "pop", "r-n-b", "rock"];
  } else if (emotion == "Fear") {
    t_energy = 0.65;
    t_mode = 0;
    // target_speechiness = 0.05;
    // target_instrumentalness = 0.9;
    t_valence = 0.65;
    t_tempo = 120;
    // genres = ["alternative", "black-metal", "classical", "goth", "psych-rock"];
  } else if (emotion == "Happy") {
    // target_danceability = 0.6;
    t_energy = 0.8;
    t_mode = 1;
    t_valence = 1;
    t_tempo = 100;
    // genres = ["dance", "happy", "party", "pop", "rock"];
  } else if (emotion == "Neutral") {
    t_energy = 0.5;
    t_mode = Math.round(Math.random());
    t_valence = 0.5;
    t_tempo = Math.floor(Math.random() * (200 - 60 + 1) + 60);
    // genres = ["acoustic", "chill", "classical", "piano", "study"];
  } else if (emotion == "Sad") {
    t_energy = 0.25;
    t_mode = 0;
    // target_acousticness = 0.6;
    t_valence = 0.1;
    t_tempo = 70;
    // genres = ["emo", "piano", "pop", "rainy-day", "sad"];
  } else if (emotion == "Surprise") {
    t_energy = 0.85;
    t_mode = 1;
    t_valence = 0.65;
    t_tempo = 150;
    // genres = ["alternative", "indie", "rock"];
  }
  spotifyApi
    .getRecommendations({
      seed_genres: genres,
      limit: numSongs,
      target_energy: t_energy,
      target_mode: t_mode,
      target_valence: t_valence,
      target_tempo: t_tempo,
    })
    .then(
      function (data) {
        let tracks = data.body.tracks;

        let urls = [];
        let arts = [];
        let arts_name = [];
        let songs = [];
        tracks.forEach((l) => urls.push(l.external_urls.spotify));
        tracks.forEach((a) => arts.push(a.artists));
        arts.forEach((a) => arts_name.push(a[0].name));
        tracks.forEach((s) => songs.push(s.name));

        var target = document.getElementById("url");
        while (target.firstChild) {
          target.removeChild(target.lastChild);
        }
        for (var i = 0; i < Object.keys(urls).length; i++) {
          // var d = document.createElement("div");
          var p = document.createElement("p");
          var b = document.createElement("br");
          var a = document.createElement("a");
          // p.insertAdjacentText("beforeend", songs[i] + " by " + arts_name[i] + ":\n");
          p.innerHTML = songs[i] + " by " + arts_name[i] + ":\n";
          a.setAttribute("href", urls[i]);
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
          // a.insertAdjacentText("beforeend", urls[i]);
          a.innerHTML = urls[i];
          p.appendChild(b);
          p.appendChild(a);
          target.appendChild(p);
        }
      },
      function (err) {
        console.error(err);
      }
    );
}

module.exports = function (n) {
  return n * 111;
};

},{"spotify-web-api-node":20}],32:[function(require,module,exports){

},{}]},{},[31])(31)
});
