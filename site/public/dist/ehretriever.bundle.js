var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// node_modules/crypto-js/core.js
var require_core = __commonJS(function(exports, module) {
  (function(root, factory) {
    if (typeof exports === "object") {
      module.exports = exports = factory();
    } else if (typeof define === "function" && define.amd) {
      define([], factory);
    } else {
      root.CryptoJS = factory();
    }
  })(exports, function() {
    var CryptoJS = CryptoJS || function(Math2, undefined2) {
      var crypto;
      if (typeof window !== "undefined" && window.crypto) {
        crypto = window.crypto;
      }
      if (typeof self !== "undefined" && self.crypto) {
        crypto = self.crypto;
      }
      if (typeof globalThis !== "undefined" && globalThis.crypto) {
        crypto = globalThis.crypto;
      }
      if (!crypto && typeof window !== "undefined" && window.msCrypto) {
        crypto = window.msCrypto;
      }
      if (!crypto && typeof global !== "undefined" && global.crypto) {
        crypto = global.crypto;
      }
      if (!crypto && true) {
        try {
          crypto = (() => ({}));
        } catch (err) {}
      }
      var cryptoSecureRandomInt = function() {
        if (crypto) {
          if (typeof crypto.getRandomValues === "function") {
            try {
              return crypto.getRandomValues(new Uint32Array(1))[0];
            } catch (err) {}
          }
          if (typeof crypto.randomBytes === "function") {
            try {
              return crypto.randomBytes(4).readInt32LE();
            } catch (err) {}
          }
        }
        throw new Error("Native crypto module could not be used to get secure random number.");
      };
      var create = Object.create || function() {
        function F() {}
        return function(obj) {
          var subtype;
          F.prototype = obj;
          subtype = new F;
          F.prototype = null;
          return subtype;
        };
      }();
      var C = {};
      var C_lib = C.lib = {};
      var Base = C_lib.Base = function() {
        return {
          extend: function(overrides) {
            var subtype = create(this);
            if (overrides) {
              subtype.mixIn(overrides);
            }
            if (!subtype.hasOwnProperty("init") || this.init === subtype.init) {
              subtype.init = function() {
                subtype.$super.init.apply(this, arguments);
              };
            }
            subtype.init.prototype = subtype;
            subtype.$super = this;
            return subtype;
          },
          create: function() {
            var instance = this.extend();
            instance.init.apply(instance, arguments);
            return instance;
          },
          init: function() {},
          mixIn: function(properties) {
            for (var propertyName in properties) {
              if (properties.hasOwnProperty(propertyName)) {
                this[propertyName] = properties[propertyName];
              }
            }
            if (properties.hasOwnProperty("toString")) {
              this.toString = properties.toString;
            }
          },
          clone: function() {
            return this.init.prototype.extend(this);
          }
        };
      }();
      var WordArray = C_lib.WordArray = Base.extend({
        init: function(words, sigBytes) {
          words = this.words = words || [];
          if (sigBytes != undefined2) {
            this.sigBytes = sigBytes;
          } else {
            this.sigBytes = words.length * 4;
          }
        },
        toString: function(encoder) {
          return (encoder || Hex).stringify(this);
        },
        concat: function(wordArray) {
          var thisWords = this.words;
          var thatWords = wordArray.words;
          var thisSigBytes = this.sigBytes;
          var thatSigBytes = wordArray.sigBytes;
          this.clamp();
          if (thisSigBytes % 4) {
            for (var i = 0;i < thatSigBytes; i++) {
              var thatByte = thatWords[i >>> 2] >>> 24 - i % 4 * 8 & 255;
              thisWords[thisSigBytes + i >>> 2] |= thatByte << 24 - (thisSigBytes + i) % 4 * 8;
            }
          } else {
            for (var j = 0;j < thatSigBytes; j += 4) {
              thisWords[thisSigBytes + j >>> 2] = thatWords[j >>> 2];
            }
          }
          this.sigBytes += thatSigBytes;
          return this;
        },
        clamp: function() {
          var words = this.words;
          var sigBytes = this.sigBytes;
          words[sigBytes >>> 2] &= 4294967295 << 32 - sigBytes % 4 * 8;
          words.length = Math2.ceil(sigBytes / 4);
        },
        clone: function() {
          var clone = Base.clone.call(this);
          clone.words = this.words.slice(0);
          return clone;
        },
        random: function(nBytes) {
          var words = [];
          for (var i = 0;i < nBytes; i += 4) {
            words.push(cryptoSecureRandomInt());
          }
          return new WordArray.init(words, nBytes);
        }
      });
      var C_enc = C.enc = {};
      var Hex = C_enc.Hex = {
        stringify: function(wordArray) {
          var words = wordArray.words;
          var sigBytes = wordArray.sigBytes;
          var hexChars = [];
          for (var i = 0;i < sigBytes; i++) {
            var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
            hexChars.push((bite >>> 4).toString(16));
            hexChars.push((bite & 15).toString(16));
          }
          return hexChars.join("");
        },
        parse: function(hexStr) {
          var hexStrLength = hexStr.length;
          var words = [];
          for (var i = 0;i < hexStrLength; i += 2) {
            words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << 24 - i % 8 * 4;
          }
          return new WordArray.init(words, hexStrLength / 2);
        }
      };
      var Latin1 = C_enc.Latin1 = {
        stringify: function(wordArray) {
          var words = wordArray.words;
          var sigBytes = wordArray.sigBytes;
          var latin1Chars = [];
          for (var i = 0;i < sigBytes; i++) {
            var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
            latin1Chars.push(String.fromCharCode(bite));
          }
          return latin1Chars.join("");
        },
        parse: function(latin1Str) {
          var latin1StrLength = latin1Str.length;
          var words = [];
          for (var i = 0;i < latin1StrLength; i++) {
            words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
          }
          return new WordArray.init(words, latin1StrLength);
        }
      };
      var Utf8 = C_enc.Utf8 = {
        stringify: function(wordArray) {
          try {
            return decodeURIComponent(escape(Latin1.stringify(wordArray)));
          } catch (e) {
            throw new Error("Malformed UTF-8 data");
          }
        },
        parse: function(utf8Str) {
          return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
        }
      };
      var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
        reset: function() {
          this._data = new WordArray.init;
          this._nDataBytes = 0;
        },
        _append: function(data) {
          if (typeof data == "string") {
            data = Utf8.parse(data);
          }
          this._data.concat(data);
          this._nDataBytes += data.sigBytes;
        },
        _process: function(doFlush) {
          var processedWords;
          var data = this._data;
          var dataWords = data.words;
          var dataSigBytes = data.sigBytes;
          var blockSize = this.blockSize;
          var blockSizeBytes = blockSize * 4;
          var nBlocksReady = dataSigBytes / blockSizeBytes;
          if (doFlush) {
            nBlocksReady = Math2.ceil(nBlocksReady);
          } else {
            nBlocksReady = Math2.max((nBlocksReady | 0) - this._minBufferSize, 0);
          }
          var nWordsReady = nBlocksReady * blockSize;
          var nBytesReady = Math2.min(nWordsReady * 4, dataSigBytes);
          if (nWordsReady) {
            for (var offset = 0;offset < nWordsReady; offset += blockSize) {
              this._doProcessBlock(dataWords, offset);
            }
            processedWords = dataWords.splice(0, nWordsReady);
            data.sigBytes -= nBytesReady;
          }
          return new WordArray.init(processedWords, nBytesReady);
        },
        clone: function() {
          var clone = Base.clone.call(this);
          clone._data = this._data.clone();
          return clone;
        },
        _minBufferSize: 0
      });
      var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
        cfg: Base.extend(),
        init: function(cfg) {
          this.cfg = this.cfg.extend(cfg);
          this.reset();
        },
        reset: function() {
          BufferedBlockAlgorithm.reset.call(this);
          this._doReset();
        },
        update: function(messageUpdate) {
          this._append(messageUpdate);
          this._process();
          return this;
        },
        finalize: function(messageUpdate) {
          if (messageUpdate) {
            this._append(messageUpdate);
          }
          var hash = this._doFinalize();
          return hash;
        },
        blockSize: 512 / 32,
        _createHelper: function(hasher) {
          return function(message, cfg) {
            return new hasher.init(cfg).finalize(message);
          };
        },
        _createHmacHelper: function(hasher) {
          return function(message, key) {
            return new C_algo.HMAC.init(hasher, key).finalize(message);
          };
        }
      });
      var C_algo = C.algo = {};
      return C;
    }(Math);
    return CryptoJS;
  });
});

// node_modules/crypto-js/lib-typedarrays.js
var require_lib_typedarrays = __commonJS(function(exports, module) {
  (function(root, factory) {
    if (typeof exports === "object") {
      module.exports = exports = factory(require_core());
    } else if (typeof define === "function" && define.amd) {
      define(["./core"], factory);
    } else {
      factory(root.CryptoJS);
    }
  })(exports, function(CryptoJS) {
    (function() {
      if (typeof ArrayBuffer != "function") {
        return;
      }
      var C = CryptoJS;
      var C_lib = C.lib;
      var WordArray = C_lib.WordArray;
      var superInit = WordArray.init;
      var subInit = WordArray.init = function(typedArray) {
        if (typedArray instanceof ArrayBuffer) {
          typedArray = new Uint8Array(typedArray);
        }
        if (typedArray instanceof Int8Array || typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray || typedArray instanceof Int16Array || typedArray instanceof Uint16Array || typedArray instanceof Int32Array || typedArray instanceof Uint32Array || typedArray instanceof Float32Array || typedArray instanceof Float64Array) {
          typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
        }
        if (typedArray instanceof Uint8Array) {
          var typedArrayByteLength = typedArray.byteLength;
          var words = [];
          for (var i = 0;i < typedArrayByteLength; i++) {
            words[i >>> 2] |= typedArray[i] << 24 - i % 4 * 8;
          }
          superInit.call(this, words, typedArrayByteLength);
        } else {
          superInit.apply(this, arguments);
        }
      };
      subInit.prototype = WordArray;
    })();
    return CryptoJS.lib.WordArray;
  });
});

// node_modules/crypto-js/sha256.js
var require_sha256 = __commonJS(function(exports, module) {
  (function(root, factory) {
    if (typeof exports === "object") {
      module.exports = exports = factory(require_core());
    } else if (typeof define === "function" && define.amd) {
      define(["./core"], factory);
    } else {
      factory(root.CryptoJS);
    }
  })(exports, function(CryptoJS) {
    (function(Math2) {
      var C = CryptoJS;
      var C_lib = C.lib;
      var WordArray = C_lib.WordArray;
      var Hasher = C_lib.Hasher;
      var C_algo = C.algo;
      var H = [];
      var K = [];
      (function() {
        function isPrime(n2) {
          var sqrtN = Math2.sqrt(n2);
          for (var factor = 2;factor <= sqrtN; factor++) {
            if (!(n2 % factor)) {
              return false;
            }
          }
          return true;
        }
        function getFractionalBits(n2) {
          return (n2 - (n2 | 0)) * 4294967296 | 0;
        }
        var n = 2;
        var nPrime = 0;
        while (nPrime < 64) {
          if (isPrime(n)) {
            if (nPrime < 8) {
              H[nPrime] = getFractionalBits(Math2.pow(n, 1 / 2));
            }
            K[nPrime] = getFractionalBits(Math2.pow(n, 1 / 3));
            nPrime++;
          }
          n++;
        }
      })();
      var W = [];
      var SHA256 = C_algo.SHA256 = Hasher.extend({
        _doReset: function() {
          this._hash = new WordArray.init(H.slice(0));
        },
        _doProcessBlock: function(M, offset) {
          var H2 = this._hash.words;
          var a = H2[0];
          var b = H2[1];
          var c = H2[2];
          var d = H2[3];
          var e = H2[4];
          var f = H2[5];
          var g = H2[6];
          var h = H2[7];
          for (var i = 0;i < 64; i++) {
            if (i < 16) {
              W[i] = M[offset + i] | 0;
            } else {
              var gamma0x = W[i - 15];
              var gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
              var gamma1x = W[i - 2];
              var gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
              W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
            }
            var ch = e & f ^ ~e & g;
            var maj = a & b ^ a & c ^ b & c;
            var sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
            var sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
            var t1 = h + sigma1 + ch + K[i] + W[i];
            var t2 = sigma0 + maj;
            h = g;
            g = f;
            f = e;
            e = d + t1 | 0;
            d = c;
            c = b;
            b = a;
            a = t1 + t2 | 0;
          }
          H2[0] = H2[0] + a | 0;
          H2[1] = H2[1] + b | 0;
          H2[2] = H2[2] + c | 0;
          H2[3] = H2[3] + d | 0;
          H2[4] = H2[4] + e | 0;
          H2[5] = H2[5] + f | 0;
          H2[6] = H2[6] + g | 0;
          H2[7] = H2[7] + h | 0;
        },
        _doFinalize: function() {
          var data = this._data;
          var dataWords = data.words;
          var nBitsTotal = this._nDataBytes * 8;
          var nBitsLeft = data.sigBytes * 8;
          dataWords[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
          dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math2.floor(nBitsTotal / 4294967296);
          dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
          data.sigBytes = dataWords.length * 4;
          this._process();
          return this._hash;
        },
        clone: function() {
          var clone = Hasher.clone.call(this);
          clone._hash = this._hash.clone();
          return clone;
        }
      });
      C.SHA256 = Hasher._createHelper(SHA256);
      C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
    })(Math);
    return CryptoJS.SHA256;
  });
});

// node_modules/crypto-js/enc-base64url.js
var require_enc_base64url = __commonJS(function(exports, module) {
  (function(root, factory) {
    if (typeof exports === "object") {
      module.exports = exports = factory(require_core());
    } else if (typeof define === "function" && define.amd) {
      define(["./core"], factory);
    } else {
      factory(root.CryptoJS);
    }
  })(exports, function(CryptoJS) {
    (function() {
      var C = CryptoJS;
      var C_lib = C.lib;
      var WordArray = C_lib.WordArray;
      var C_enc = C.enc;
      var Base64url = C_enc.Base64url = {
        stringify: function(wordArray, urlSafe) {
          if (urlSafe === undefined) {
            urlSafe = true;
          }
          var words = wordArray.words;
          var sigBytes = wordArray.sigBytes;
          var map = urlSafe ? this._safe_map : this._map;
          wordArray.clamp();
          var base64Chars = [];
          for (var i = 0;i < sigBytes; i += 3) {
            var byte1 = words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
            var byte2 = words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
            var byte3 = words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
            var triplet = byte1 << 16 | byte2 << 8 | byte3;
            for (var j = 0;j < 4 && i + j * 0.75 < sigBytes; j++) {
              base64Chars.push(map.charAt(triplet >>> 6 * (3 - j) & 63));
            }
          }
          var paddingChar = map.charAt(64);
          if (paddingChar) {
            while (base64Chars.length % 4) {
              base64Chars.push(paddingChar);
            }
          }
          return base64Chars.join("");
        },
        parse: function(base64Str, urlSafe) {
          if (urlSafe === undefined) {
            urlSafe = true;
          }
          var base64StrLength = base64Str.length;
          var map = urlSafe ? this._safe_map : this._map;
          var reverseMap = this._reverseMap;
          if (!reverseMap) {
            reverseMap = this._reverseMap = [];
            for (var j = 0;j < map.length; j++) {
              reverseMap[map.charCodeAt(j)] = j;
            }
          }
          var paddingChar = map.charAt(64);
          if (paddingChar) {
            var paddingIndex = base64Str.indexOf(paddingChar);
            if (paddingIndex !== -1) {
              base64StrLength = paddingIndex;
            }
          }
          return parseLoop(base64Str, base64StrLength, reverseMap);
        },
        _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        _safe_map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
      };
      function parseLoop(base64Str, base64StrLength, reverseMap) {
        var words = [];
        var nBytes = 0;
        for (var i = 0;i < base64StrLength; i++) {
          if (i % 4) {
            var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << i % 4 * 2;
            var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> 6 - i % 4 * 2;
            var bitsCombined = bits1 | bits2;
            words[nBytes >>> 2] |= bitsCombined << 24 - nBytes % 4 * 8;
            nBytes++;
          }
        }
        return WordArray.create(words, nBytes);
      }
    })();
    return CryptoJS.enc.Base64url;
  });
});

// node_modules/lodash/lodash.js
var require_lodash = __commonJS(function(exports, module) {
  (function() {
    var undefined2;
    var VERSION = "4.17.21";
    var LARGE_ARRAY_SIZE = 200;
    var CORE_ERROR_TEXT = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", FUNC_ERROR_TEXT = "Expected a function", INVALID_TEMPL_VAR_ERROR_TEXT = "Invalid `variable` option passed into `_.template`";
    var HASH_UNDEFINED = "__lodash_hash_undefined__";
    var MAX_MEMOIZE_SIZE = 500;
    var PLACEHOLDER = "__lodash_placeholder__";
    var CLONE_DEEP_FLAG = 1, CLONE_FLAT_FLAG = 2, CLONE_SYMBOLS_FLAG = 4;
    var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
    var WRAP_BIND_FLAG = 1, WRAP_BIND_KEY_FLAG = 2, WRAP_CURRY_BOUND_FLAG = 4, WRAP_CURRY_FLAG = 8, WRAP_CURRY_RIGHT_FLAG = 16, WRAP_PARTIAL_FLAG = 32, WRAP_PARTIAL_RIGHT_FLAG = 64, WRAP_ARY_FLAG = 128, WRAP_REARG_FLAG = 256, WRAP_FLIP_FLAG = 512;
    var DEFAULT_TRUNC_LENGTH = 30, DEFAULT_TRUNC_OMISSION = "...";
    var HOT_COUNT = 800, HOT_SPAN = 16;
    var LAZY_FILTER_FLAG = 1, LAZY_MAP_FLAG = 2, LAZY_WHILE_FLAG = 3;
    var INFINITY = 1 / 0, MAX_SAFE_INTEGER = 9007199254740991, MAX_INTEGER = 179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000, NAN = 0 / 0;
    var MAX_ARRAY_LENGTH = 4294967295, MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1, HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;
    var wrapFlags = [
      ["ary", WRAP_ARY_FLAG],
      ["bind", WRAP_BIND_FLAG],
      ["bindKey", WRAP_BIND_KEY_FLAG],
      ["curry", WRAP_CURRY_FLAG],
      ["curryRight", WRAP_CURRY_RIGHT_FLAG],
      ["flip", WRAP_FLIP_FLAG],
      ["partial", WRAP_PARTIAL_FLAG],
      ["partialRight", WRAP_PARTIAL_RIGHT_FLAG],
      ["rearg", WRAP_REARG_FLAG]
    ];
    var argsTag = "[object Arguments]", arrayTag = "[object Array]", asyncTag = "[object AsyncFunction]", boolTag = "[object Boolean]", dateTag = "[object Date]", domExcTag = "[object DOMException]", errorTag = "[object Error]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", mapTag = "[object Map]", numberTag = "[object Number]", nullTag = "[object Null]", objectTag = "[object Object]", promiseTag = "[object Promise]", proxyTag = "[object Proxy]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]", undefinedTag = "[object Undefined]", weakMapTag = "[object WeakMap]", weakSetTag = "[object WeakSet]";
    var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
    var reEmptyStringLeading = /\b__p \+= '';/g, reEmptyStringMiddle = /\b(__p \+=) '' \+/g, reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;
    var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g, reUnescapedHtml = /[&<>"']/g, reHasEscapedHtml = RegExp(reEscapedHtml.source), reHasUnescapedHtml = RegExp(reUnescapedHtml.source);
    var reEscape = /<%-([\s\S]+?)%>/g, reEvaluate = /<%([\s\S]+?)%>/g, reInterpolate = /<%=([\s\S]+?)%>/g;
    var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/, rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g, reHasRegExpChar = RegExp(reRegExpChar.source);
    var reTrimStart = /^\s+/;
    var reWhitespace = /\s/;
    var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/, reSplitDetails = /,? & /;
    var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
    var reForbiddenIdentifierChars = /[()=,{}\[\]\/\s]/;
    var reEscapeChar = /\\(\\)?/g;
    var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;
    var reFlags = /\w*$/;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsHostCtor = /^\[object .+?Constructor\]$/;
    var reIsOctal = /^0o[0-7]+$/i;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
    var reNoMatch = /($^)/;
    var reUnescapedString = /['\n\r\u2028\u2029\\]/g;
    var rsAstralRange = "\\ud800-\\udfff", rsComboMarksRange = "\\u0300-\\u036f", reComboHalfMarksRange = "\\ufe20-\\ufe2f", rsComboSymbolsRange = "\\u20d0-\\u20ff", rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange, rsDingbatRange = "\\u2700-\\u27bf", rsLowerRange = "a-z\\xdf-\\xf6\\xf8-\\xff", rsMathOpRange = "\\xac\\xb1\\xd7\\xf7", rsNonCharRange = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", rsPunctuationRange = "\\u2000-\\u206f", rsSpaceRange = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", rsUpperRange = "A-Z\\xc0-\\xd6\\xd8-\\xde", rsVarRange = "\\ufe0e\\ufe0f", rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
    var rsApos = "['’]", rsAstral = "[" + rsAstralRange + "]", rsBreak = "[" + rsBreakRange + "]", rsCombo = "[" + rsComboRange + "]", rsDigits = "\\d+", rsDingbat = "[" + rsDingbatRange + "]", rsLower = "[" + rsLowerRange + "]", rsMisc = "[^" + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + "]", rsFitz = "\\ud83c[\\udffb-\\udfff]", rsModifier = "(?:" + rsCombo + "|" + rsFitz + ")", rsNonAstral = "[^" + rsAstralRange + "]", rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}", rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]", rsUpper = "[" + rsUpperRange + "]", rsZWJ = "\\u200d";
    var rsMiscLower = "(?:" + rsLower + "|" + rsMisc + ")", rsMiscUpper = "(?:" + rsUpper + "|" + rsMisc + ")", rsOptContrLower = "(?:" + rsApos + "(?:d|ll|m|re|s|t|ve))?", rsOptContrUpper = "(?:" + rsApos + "(?:D|LL|M|RE|S|T|VE))?", reOptMod = rsModifier + "?", rsOptVar = "[" + rsVarRange + "]?", rsOptJoin = "(?:" + rsZWJ + "(?:" + [rsNonAstral, rsRegional, rsSurrPair].join("|") + ")" + rsOptVar + reOptMod + ")*", rsOrdLower = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", rsOrdUpper = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", rsSeq = rsOptVar + reOptMod + rsOptJoin, rsEmoji = "(?:" + [rsDingbat, rsRegional, rsSurrPair].join("|") + ")" + rsSeq, rsSymbol = "(?:" + [rsNonAstral + rsCombo + "?", rsCombo, rsRegional, rsSurrPair, rsAstral].join("|") + ")";
    var reApos = RegExp(rsApos, "g");
    var reComboMark = RegExp(rsCombo, "g");
    var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq, "g");
    var reUnicodeWord = RegExp([
      rsUpper + "?" + rsLower + "+" + rsOptContrLower + "(?=" + [rsBreak, rsUpper, "$"].join("|") + ")",
      rsMiscUpper + "+" + rsOptContrUpper + "(?=" + [rsBreak, rsUpper + rsMiscLower, "$"].join("|") + ")",
      rsUpper + "?" + rsMiscLower + "+" + rsOptContrLower,
      rsUpper + "+" + rsOptContrUpper,
      rsOrdUpper,
      rsOrdLower,
      rsDigits,
      rsEmoji
    ].join("|"), "g");
    var reHasUnicode = RegExp("[" + rsZWJ + rsAstralRange + rsComboRange + rsVarRange + "]");
    var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
    var contextProps = [
      "Array",
      "Buffer",
      "DataView",
      "Date",
      "Error",
      "Float32Array",
      "Float64Array",
      "Function",
      "Int8Array",
      "Int16Array",
      "Int32Array",
      "Map",
      "Math",
      "Object",
      "Promise",
      "RegExp",
      "Set",
      "String",
      "Symbol",
      "TypeError",
      "Uint8Array",
      "Uint8ClampedArray",
      "Uint16Array",
      "Uint32Array",
      "WeakMap",
      "_",
      "clearTimeout",
      "isFinite",
      "parseInt",
      "setTimeout"
    ];
    var templateCounter = -1;
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
    var cloneableTags = {};
    cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[setTag] = cloneableTags[stringTag] = cloneableTags[symbolTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
    cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;
    var deburredLetters = {
      "À": "A",
      "Á": "A",
      "Â": "A",
      "Ã": "A",
      "Ä": "A",
      "Å": "A",
      "à": "a",
      "á": "a",
      "â": "a",
      "ã": "a",
      "ä": "a",
      "å": "a",
      "Ç": "C",
      "ç": "c",
      "Ð": "D",
      "ð": "d",
      "È": "E",
      "É": "E",
      "Ê": "E",
      "Ë": "E",
      "è": "e",
      "é": "e",
      "ê": "e",
      "ë": "e",
      "Ì": "I",
      "Í": "I",
      "Î": "I",
      "Ï": "I",
      "ì": "i",
      "í": "i",
      "î": "i",
      "ï": "i",
      "Ñ": "N",
      "ñ": "n",
      "Ò": "O",
      "Ó": "O",
      "Ô": "O",
      "Õ": "O",
      "Ö": "O",
      "Ø": "O",
      "ò": "o",
      "ó": "o",
      "ô": "o",
      "õ": "o",
      "ö": "o",
      "ø": "o",
      "Ù": "U",
      "Ú": "U",
      "Û": "U",
      "Ü": "U",
      "ù": "u",
      "ú": "u",
      "û": "u",
      "ü": "u",
      "Ý": "Y",
      "ý": "y",
      "ÿ": "y",
      "Æ": "Ae",
      "æ": "ae",
      "Þ": "Th",
      "þ": "th",
      "ß": "ss",
      "Ā": "A",
      "Ă": "A",
      "Ą": "A",
      "ā": "a",
      "ă": "a",
      "ą": "a",
      "Ć": "C",
      "Ĉ": "C",
      "Ċ": "C",
      "Č": "C",
      "ć": "c",
      "ĉ": "c",
      "ċ": "c",
      "č": "c",
      "Ď": "D",
      "Đ": "D",
      "ď": "d",
      "đ": "d",
      "Ē": "E",
      "Ĕ": "E",
      "Ė": "E",
      "Ę": "E",
      "Ě": "E",
      "ē": "e",
      "ĕ": "e",
      "ė": "e",
      "ę": "e",
      "ě": "e",
      "Ĝ": "G",
      "Ğ": "G",
      "Ġ": "G",
      "Ģ": "G",
      "ĝ": "g",
      "ğ": "g",
      "ġ": "g",
      "ģ": "g",
      "Ĥ": "H",
      "Ħ": "H",
      "ĥ": "h",
      "ħ": "h",
      "Ĩ": "I",
      "Ī": "I",
      "Ĭ": "I",
      "Į": "I",
      "İ": "I",
      "ĩ": "i",
      "ī": "i",
      "ĭ": "i",
      "į": "i",
      "ı": "i",
      "Ĵ": "J",
      "ĵ": "j",
      "Ķ": "K",
      "ķ": "k",
      "ĸ": "k",
      "Ĺ": "L",
      "Ļ": "L",
      "Ľ": "L",
      "Ŀ": "L",
      "Ł": "L",
      "ĺ": "l",
      "ļ": "l",
      "ľ": "l",
      "ŀ": "l",
      "ł": "l",
      "Ń": "N",
      "Ņ": "N",
      "Ň": "N",
      "Ŋ": "N",
      "ń": "n",
      "ņ": "n",
      "ň": "n",
      "ŋ": "n",
      "Ō": "O",
      "Ŏ": "O",
      "Ő": "O",
      "ō": "o",
      "ŏ": "o",
      "ő": "o",
      "Ŕ": "R",
      "Ŗ": "R",
      "Ř": "R",
      "ŕ": "r",
      "ŗ": "r",
      "ř": "r",
      "Ś": "S",
      "Ŝ": "S",
      "Ş": "S",
      "Š": "S",
      "ś": "s",
      "ŝ": "s",
      "ş": "s",
      "š": "s",
      "Ţ": "T",
      "Ť": "T",
      "Ŧ": "T",
      "ţ": "t",
      "ť": "t",
      "ŧ": "t",
      "Ũ": "U",
      "Ū": "U",
      "Ŭ": "U",
      "Ů": "U",
      "Ű": "U",
      "Ų": "U",
      "ũ": "u",
      "ū": "u",
      "ŭ": "u",
      "ů": "u",
      "ű": "u",
      "ų": "u",
      "Ŵ": "W",
      "ŵ": "w",
      "Ŷ": "Y",
      "ŷ": "y",
      "Ÿ": "Y",
      "Ź": "Z",
      "Ż": "Z",
      "Ž": "Z",
      "ź": "z",
      "ż": "z",
      "ž": "z",
      "Ĳ": "IJ",
      "ĳ": "ij",
      "Œ": "Oe",
      "œ": "oe",
      "ŉ": "'n",
      "ſ": "s"
    };
    var htmlEscapes = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    var htmlUnescapes = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'"
    };
    var stringEscapes = {
      "\\": "\\",
      "'": "'",
      "\n": "n",
      "\r": "r",
      "\u2028": "u2028",
      "\u2029": "u2029"
    };
    var freeParseFloat = parseFloat, freeParseInt = parseInt;
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
    var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
    var moduleExports = freeModule && freeModule.exports === freeExports;
    var freeProcess = moduleExports && freeGlobal.process;
    var nodeUtil = function() {
      try {
        var types = freeModule && freeModule.require && freeModule.require("util").types;
        if (types) {
          return types;
        }
        return freeProcess && freeProcess.binding && freeProcess.binding("util");
      } catch (e) {}
    }();
    var nodeIsArrayBuffer = nodeUtil && nodeUtil.isArrayBuffer, nodeIsDate = nodeUtil && nodeUtil.isDate, nodeIsMap = nodeUtil && nodeUtil.isMap, nodeIsRegExp = nodeUtil && nodeUtil.isRegExp, nodeIsSet = nodeUtil && nodeUtil.isSet, nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
    function apply(func, thisArg, args) {
      switch (args.length) {
        case 0:
          return func.call(thisArg);
        case 1:
          return func.call(thisArg, args[0]);
        case 2:
          return func.call(thisArg, args[0], args[1]);
        case 3:
          return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }
    function arrayAggregator(array, setter, iteratee, accumulator) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        var value = array[index];
        setter(accumulator, value, iteratee(value), array);
      }
      return accumulator;
    }
    function arrayEach(array, iteratee) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }
    function arrayEachRight(array, iteratee) {
      var length = array == null ? 0 : array.length;
      while (length--) {
        if (iteratee(array[length], length, array) === false) {
          break;
        }
      }
      return array;
    }
    function arrayEvery(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (!predicate(array[index], index, array)) {
          return false;
        }
      }
      return true;
    }
    function arrayFilter(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[resIndex++] = value;
        }
      }
      return result;
    }
    function arrayIncludes(array, value) {
      var length = array == null ? 0 : array.length;
      return !!length && baseIndexOf(array, value, 0) > -1;
    }
    function arrayIncludesWith(array, value, comparator) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (comparator(value, array[index])) {
          return true;
        }
      }
      return false;
    }
    function arrayMap(array, iteratee) {
      var index = -1, length = array == null ? 0 : array.length, result = Array(length);
      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }
    function arrayPush(array, values) {
      var index = -1, length = values.length, offset = array.length;
      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }
    function arrayReduce(array, iteratee, accumulator, initAccum) {
      var index = -1, length = array == null ? 0 : array.length;
      if (initAccum && length) {
        accumulator = array[++index];
      }
      while (++index < length) {
        accumulator = iteratee(accumulator, array[index], index, array);
      }
      return accumulator;
    }
    function arrayReduceRight(array, iteratee, accumulator, initAccum) {
      var length = array == null ? 0 : array.length;
      if (initAccum && length) {
        accumulator = array[--length];
      }
      while (length--) {
        accumulator = iteratee(accumulator, array[length], length, array);
      }
      return accumulator;
    }
    function arraySome(array, predicate) {
      var index = -1, length = array == null ? 0 : array.length;
      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }
    var asciiSize = baseProperty("length");
    function asciiToArray(string) {
      return string.split("");
    }
    function asciiWords(string) {
      return string.match(reAsciiWord) || [];
    }
    function baseFindKey(collection, predicate, eachFunc) {
      var result;
      eachFunc(collection, function(value, key, collection2) {
        if (predicate(value, key, collection2)) {
          result = key;
          return false;
        }
      });
      return result;
    }
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
      while (fromRight ? index-- : ++index < length) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }
    function baseIndexOf(array, value, fromIndex) {
      return value === value ? strictIndexOf(array, value, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
    }
    function baseIndexOfWith(array, value, fromIndex, comparator) {
      var index = fromIndex - 1, length = array.length;
      while (++index < length) {
        if (comparator(array[index], value)) {
          return index;
        }
      }
      return -1;
    }
    function baseIsNaN(value) {
      return value !== value;
    }
    function baseMean(array, iteratee) {
      var length = array == null ? 0 : array.length;
      return length ? baseSum(array, iteratee) / length : NAN;
    }
    function baseProperty(key) {
      return function(object) {
        return object == null ? undefined2 : object[key];
      };
    }
    function basePropertyOf(object) {
      return function(key) {
        return object == null ? undefined2 : object[key];
      };
    }
    function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
      eachFunc(collection, function(value, index, collection2) {
        accumulator = initAccum ? (initAccum = false, value) : iteratee(accumulator, value, index, collection2);
      });
      return accumulator;
    }
    function baseSortBy(array, comparer) {
      var length = array.length;
      array.sort(comparer);
      while (length--) {
        array[length] = array[length].value;
      }
      return array;
    }
    function baseSum(array, iteratee) {
      var result, index = -1, length = array.length;
      while (++index < length) {
        var current = iteratee(array[index]);
        if (current !== undefined2) {
          result = result === undefined2 ? current : result + current;
        }
      }
      return result;
    }
    function baseTimes(n, iteratee) {
      var index = -1, result = Array(n);
      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }
    function baseToPairs(object, props) {
      return arrayMap(props, function(key) {
        return [key, object[key]];
      });
    }
    function baseTrim(string) {
      return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
    }
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }
    function baseValues(object, props) {
      return arrayMap(props, function(key) {
        return object[key];
      });
    }
    function cacheHas(cache, key) {
      return cache.has(key);
    }
    function charsStartIndex(strSymbols, chrSymbols) {
      var index = -1, length = strSymbols.length;
      while (++index < length && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
      return index;
    }
    function charsEndIndex(strSymbols, chrSymbols) {
      var index = strSymbols.length;
      while (index-- && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
      return index;
    }
    function countHolders(array, placeholder) {
      var length = array.length, result = 0;
      while (length--) {
        if (array[length] === placeholder) {
          ++result;
        }
      }
      return result;
    }
    var deburrLetter = basePropertyOf(deburredLetters);
    var escapeHtmlChar = basePropertyOf(htmlEscapes);
    function escapeStringChar(chr) {
      return "\\" + stringEscapes[chr];
    }
    function getValue(object, key) {
      return object == null ? undefined2 : object[key];
    }
    function hasUnicode(string) {
      return reHasUnicode.test(string);
    }
    function hasUnicodeWord(string) {
      return reHasUnicodeWord.test(string);
    }
    function iteratorToArray(iterator) {
      var data, result = [];
      while (!(data = iterator.next()).done) {
        result.push(data.value);
      }
      return result;
    }
    function mapToArray(map) {
      var index = -1, result = Array(map.size);
      map.forEach(function(value, key) {
        result[++index] = [key, value];
      });
      return result;
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    function replaceHolders(array, placeholder) {
      var index = -1, length = array.length, resIndex = 0, result = [];
      while (++index < length) {
        var value = array[index];
        if (value === placeholder || value === PLACEHOLDER) {
          array[index] = PLACEHOLDER;
          result[resIndex++] = index;
        }
      }
      return result;
    }
    function setToArray(set) {
      var index = -1, result = Array(set.size);
      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }
    function setToPairs(set) {
      var index = -1, result = Array(set.size);
      set.forEach(function(value) {
        result[++index] = [value, value];
      });
      return result;
    }
    function strictIndexOf(array, value, fromIndex) {
      var index = fromIndex - 1, length = array.length;
      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }
    function strictLastIndexOf(array, value, fromIndex) {
      var index = fromIndex + 1;
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return index;
    }
    function stringSize(string) {
      return hasUnicode(string) ? unicodeSize(string) : asciiSize(string);
    }
    function stringToArray(string) {
      return hasUnicode(string) ? unicodeToArray(string) : asciiToArray(string);
    }
    function trimmedEndIndex(string) {
      var index = string.length;
      while (index-- && reWhitespace.test(string.charAt(index))) {}
      return index;
    }
    var unescapeHtmlChar = basePropertyOf(htmlUnescapes);
    function unicodeSize(string) {
      var result = reUnicode.lastIndex = 0;
      while (reUnicode.test(string)) {
        ++result;
      }
      return result;
    }
    function unicodeToArray(string) {
      return string.match(reUnicode) || [];
    }
    function unicodeWords(string) {
      return string.match(reUnicodeWord) || [];
    }
    var runInContext = function runInContext2(context) {
      context = context == null ? root : _.defaults(root.Object(), context, _.pick(root, contextProps));
      var { Array: Array2, Date, Error: Error2, Function: Function2, Math: Math2, Object: Object2, RegExp: RegExp2, String: String2, TypeError: TypeError2 } = context;
      var arrayProto = Array2.prototype, funcProto = Function2.prototype, objectProto = Object2.prototype;
      var coreJsData = context["__core-js_shared__"];
      var funcToString = funcProto.toString;
      var hasOwnProperty = objectProto.hasOwnProperty;
      var idCounter = 0;
      var maskSrcKey = function() {
        var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
        return uid ? "Symbol(src)_1." + uid : "";
      }();
      var nativeObjectToString = objectProto.toString;
      var objectCtorString = funcToString.call(Object2);
      var oldDash = root._;
      var reIsNative = RegExp2("^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
      var Buffer2 = moduleExports ? context.Buffer : undefined2, Symbol2 = context.Symbol, Uint8Array2 = context.Uint8Array, allocUnsafe = Buffer2 ? Buffer2.allocUnsafe : undefined2, getPrototype = overArg(Object2.getPrototypeOf, Object2), objectCreate = Object2.create, propertyIsEnumerable = objectProto.propertyIsEnumerable, splice = arrayProto.splice, spreadableSymbol = Symbol2 ? Symbol2.isConcatSpreadable : undefined2, symIterator = Symbol2 ? Symbol2.iterator : undefined2, symToStringTag = Symbol2 ? Symbol2.toStringTag : undefined2;
      var defineProperty = function() {
        try {
          var func = getNative(Object2, "defineProperty");
          func({}, "", {});
          return func;
        } catch (e) {}
      }();
      var ctxClearTimeout = context.clearTimeout !== root.clearTimeout && context.clearTimeout, ctxNow = Date && Date.now !== root.Date.now && Date.now, ctxSetTimeout = context.setTimeout !== root.setTimeout && context.setTimeout;
      var { ceil: nativeCeil, floor: nativeFloor } = Math2, nativeGetSymbols = Object2.getOwnPropertySymbols, nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : undefined2, nativeIsFinite = context.isFinite, nativeJoin = arrayProto.join, nativeKeys = overArg(Object2.keys, Object2), nativeMax = Math2.max, nativeMin = Math2.min, nativeNow = Date.now, nativeParseInt = context.parseInt, nativeRandom = Math2.random, nativeReverse = arrayProto.reverse;
      var DataView2 = getNative(context, "DataView"), Map2 = getNative(context, "Map"), Promise2 = getNative(context, "Promise"), Set2 = getNative(context, "Set"), WeakMap2 = getNative(context, "WeakMap"), nativeCreate = getNative(Object2, "create");
      var metaMap = WeakMap2 && new WeakMap2;
      var realNames = {};
      var dataViewCtorString = toSource(DataView2), mapCtorString = toSource(Map2), promiseCtorString = toSource(Promise2), setCtorString = toSource(Set2), weakMapCtorString = toSource(WeakMap2);
      var symbolProto = Symbol2 ? Symbol2.prototype : undefined2, symbolValueOf = symbolProto ? symbolProto.valueOf : undefined2, symbolToString = symbolProto ? symbolProto.toString : undefined2;
      function lodash(value) {
        if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
          if (value instanceof LodashWrapper) {
            return value;
          }
          if (hasOwnProperty.call(value, "__wrapped__")) {
            return wrapperClone(value);
          }
        }
        return new LodashWrapper(value);
      }
      var baseCreate = function() {
        function object() {}
        return function(proto) {
          if (!isObject(proto)) {
            return {};
          }
          if (objectCreate) {
            return objectCreate(proto);
          }
          object.prototype = proto;
          var result2 = new object;
          object.prototype = undefined2;
          return result2;
        };
      }();
      function baseLodash() {}
      function LodashWrapper(value, chainAll) {
        this.__wrapped__ = value;
        this.__actions__ = [];
        this.__chain__ = !!chainAll;
        this.__index__ = 0;
        this.__values__ = undefined2;
      }
      lodash.templateSettings = {
        escape: reEscape,
        evaluate: reEvaluate,
        interpolate: reInterpolate,
        variable: "",
        imports: {
          _: lodash
        }
      };
      lodash.prototype = baseLodash.prototype;
      lodash.prototype.constructor = lodash;
      LodashWrapper.prototype = baseCreate(baseLodash.prototype);
      LodashWrapper.prototype.constructor = LodashWrapper;
      function LazyWrapper(value) {
        this.__wrapped__ = value;
        this.__actions__ = [];
        this.__dir__ = 1;
        this.__filtered__ = false;
        this.__iteratees__ = [];
        this.__takeCount__ = MAX_ARRAY_LENGTH;
        this.__views__ = [];
      }
      function lazyClone() {
        var result2 = new LazyWrapper(this.__wrapped__);
        result2.__actions__ = copyArray(this.__actions__);
        result2.__dir__ = this.__dir__;
        result2.__filtered__ = this.__filtered__;
        result2.__iteratees__ = copyArray(this.__iteratees__);
        result2.__takeCount__ = this.__takeCount__;
        result2.__views__ = copyArray(this.__views__);
        return result2;
      }
      function lazyReverse() {
        if (this.__filtered__) {
          var result2 = new LazyWrapper(this);
          result2.__dir__ = -1;
          result2.__filtered__ = true;
        } else {
          result2 = this.clone();
          result2.__dir__ *= -1;
        }
        return result2;
      }
      function lazyValue() {
        var array = this.__wrapped__.value(), dir = this.__dir__, isArr = isArray(array), isRight = dir < 0, arrLength = isArr ? array.length : 0, view = getView(0, arrLength, this.__views__), start = view.start, end = view.end, length = end - start, index = isRight ? end : start - 1, iteratees = this.__iteratees__, iterLength = iteratees.length, resIndex = 0, takeCount = nativeMin(length, this.__takeCount__);
        if (!isArr || !isRight && arrLength == length && takeCount == length) {
          return baseWrapperValue(array, this.__actions__);
        }
        var result2 = [];
        outer:
          while (length-- && resIndex < takeCount) {
            index += dir;
            var iterIndex = -1, value = array[index];
            while (++iterIndex < iterLength) {
              var data = iteratees[iterIndex], iteratee2 = data.iteratee, type = data.type, computed = iteratee2(value);
              if (type == LAZY_MAP_FLAG) {
                value = computed;
              } else if (!computed) {
                if (type == LAZY_FILTER_FLAG) {
                  continue outer;
                } else {
                  break outer;
                }
              }
            }
            result2[resIndex++] = value;
          }
        return result2;
      }
      LazyWrapper.prototype = baseCreate(baseLodash.prototype);
      LazyWrapper.prototype.constructor = LazyWrapper;
      function Hash(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function hashClear() {
        this.__data__ = nativeCreate ? nativeCreate(null) : {};
        this.size = 0;
      }
      function hashDelete(key) {
        var result2 = this.has(key) && delete this.__data__[key];
        this.size -= result2 ? 1 : 0;
        return result2;
      }
      function hashGet(key) {
        var data = this.__data__;
        if (nativeCreate) {
          var result2 = data[key];
          return result2 === HASH_UNDEFINED ? undefined2 : result2;
        }
        return hasOwnProperty.call(data, key) ? data[key] : undefined2;
      }
      function hashHas(key) {
        var data = this.__data__;
        return nativeCreate ? data[key] !== undefined2 : hasOwnProperty.call(data, key);
      }
      function hashSet(key, value) {
        var data = this.__data__;
        this.size += this.has(key) ? 0 : 1;
        data[key] = nativeCreate && value === undefined2 ? HASH_UNDEFINED : value;
        return this;
      }
      Hash.prototype.clear = hashClear;
      Hash.prototype["delete"] = hashDelete;
      Hash.prototype.get = hashGet;
      Hash.prototype.has = hashHas;
      Hash.prototype.set = hashSet;
      function ListCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function listCacheClear() {
        this.__data__ = [];
        this.size = 0;
      }
      function listCacheDelete(key) {
        var data = this.__data__, index = assocIndexOf(data, key);
        if (index < 0) {
          return false;
        }
        var lastIndex = data.length - 1;
        if (index == lastIndex) {
          data.pop();
        } else {
          splice.call(data, index, 1);
        }
        --this.size;
        return true;
      }
      function listCacheGet(key) {
        var data = this.__data__, index = assocIndexOf(data, key);
        return index < 0 ? undefined2 : data[index][1];
      }
      function listCacheHas(key) {
        return assocIndexOf(this.__data__, key) > -1;
      }
      function listCacheSet(key, value) {
        var data = this.__data__, index = assocIndexOf(data, key);
        if (index < 0) {
          ++this.size;
          data.push([key, value]);
        } else {
          data[index][1] = value;
        }
        return this;
      }
      ListCache.prototype.clear = listCacheClear;
      ListCache.prototype["delete"] = listCacheDelete;
      ListCache.prototype.get = listCacheGet;
      ListCache.prototype.has = listCacheHas;
      ListCache.prototype.set = listCacheSet;
      function MapCache(entries) {
        var index = -1, length = entries == null ? 0 : entries.length;
        this.clear();
        while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
        }
      }
      function mapCacheClear() {
        this.size = 0;
        this.__data__ = {
          hash: new Hash,
          map: new (Map2 || ListCache),
          string: new Hash
        };
      }
      function mapCacheDelete(key) {
        var result2 = getMapData(this, key)["delete"](key);
        this.size -= result2 ? 1 : 0;
        return result2;
      }
      function mapCacheGet(key) {
        return getMapData(this, key).get(key);
      }
      function mapCacheHas(key) {
        return getMapData(this, key).has(key);
      }
      function mapCacheSet(key, value) {
        var data = getMapData(this, key), size2 = data.size;
        data.set(key, value);
        this.size += data.size == size2 ? 0 : 1;
        return this;
      }
      MapCache.prototype.clear = mapCacheClear;
      MapCache.prototype["delete"] = mapCacheDelete;
      MapCache.prototype.get = mapCacheGet;
      MapCache.prototype.has = mapCacheHas;
      MapCache.prototype.set = mapCacheSet;
      function SetCache(values2) {
        var index = -1, length = values2 == null ? 0 : values2.length;
        this.__data__ = new MapCache;
        while (++index < length) {
          this.add(values2[index]);
        }
      }
      function setCacheAdd(value) {
        this.__data__.set(value, HASH_UNDEFINED);
        return this;
      }
      function setCacheHas(value) {
        return this.__data__.has(value);
      }
      SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
      SetCache.prototype.has = setCacheHas;
      function Stack(entries) {
        var data = this.__data__ = new ListCache(entries);
        this.size = data.size;
      }
      function stackClear() {
        this.__data__ = new ListCache;
        this.size = 0;
      }
      function stackDelete(key) {
        var data = this.__data__, result2 = data["delete"](key);
        this.size = data.size;
        return result2;
      }
      function stackGet(key) {
        return this.__data__.get(key);
      }
      function stackHas(key) {
        return this.__data__.has(key);
      }
      function stackSet(key, value) {
        var data = this.__data__;
        if (data instanceof ListCache) {
          var pairs = data.__data__;
          if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
            pairs.push([key, value]);
            this.size = ++data.size;
            return this;
          }
          data = this.__data__ = new MapCache(pairs);
        }
        data.set(key, value);
        this.size = data.size;
        return this;
      }
      Stack.prototype.clear = stackClear;
      Stack.prototype["delete"] = stackDelete;
      Stack.prototype.get = stackGet;
      Stack.prototype.has = stackHas;
      Stack.prototype.set = stackSet;
      function arrayLikeKeys(value, inherited) {
        var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result2 = skipIndexes ? baseTimes(value.length, String2) : [], length = result2.length;
        for (var key in value) {
          if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isBuff && (key == "offset" || key == "parent") || isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || isIndex(key, length)))) {
            result2.push(key);
          }
        }
        return result2;
      }
      function arraySample(array) {
        var length = array.length;
        return length ? array[baseRandom(0, length - 1)] : undefined2;
      }
      function arraySampleSize(array, n) {
        return shuffleSelf(copyArray(array), baseClamp(n, 0, array.length));
      }
      function arrayShuffle(array) {
        return shuffleSelf(copyArray(array));
      }
      function assignMergeValue(object, key, value) {
        if (value !== undefined2 && !eq(object[key], value) || value === undefined2 && !(key in object)) {
          baseAssignValue(object, key, value);
        }
      }
      function assignValue(object, key, value) {
        var objValue = object[key];
        if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === undefined2 && !(key in object)) {
          baseAssignValue(object, key, value);
        }
      }
      function assocIndexOf(array, key) {
        var length = array.length;
        while (length--) {
          if (eq(array[length][0], key)) {
            return length;
          }
        }
        return -1;
      }
      function baseAggregator(collection, setter, iteratee2, accumulator) {
        baseEach(collection, function(value, key, collection2) {
          setter(accumulator, value, iteratee2(value), collection2);
        });
        return accumulator;
      }
      function baseAssign(object, source) {
        return object && copyObject(source, keys(source), object);
      }
      function baseAssignIn(object, source) {
        return object && copyObject(source, keysIn(source), object);
      }
      function baseAssignValue(object, key, value) {
        if (key == "__proto__" && defineProperty) {
          defineProperty(object, key, {
            configurable: true,
            enumerable: true,
            value,
            writable: true
          });
        } else {
          object[key] = value;
        }
      }
      function baseAt(object, paths) {
        var index = -1, length = paths.length, result2 = Array2(length), skip = object == null;
        while (++index < length) {
          result2[index] = skip ? undefined2 : get(object, paths[index]);
        }
        return result2;
      }
      function baseClamp(number, lower, upper) {
        if (number === number) {
          if (upper !== undefined2) {
            number = number <= upper ? number : upper;
          }
          if (lower !== undefined2) {
            number = number >= lower ? number : lower;
          }
        }
        return number;
      }
      function baseClone(value, bitmask, customizer, key, object, stack) {
        var result2, isDeep = bitmask & CLONE_DEEP_FLAG, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG;
        if (customizer) {
          result2 = object ? customizer(value, key, object, stack) : customizer(value);
        }
        if (result2 !== undefined2) {
          return result2;
        }
        if (!isObject(value)) {
          return value;
        }
        var isArr = isArray(value);
        if (isArr) {
          result2 = initCloneArray(value);
          if (!isDeep) {
            return copyArray(value, result2);
          }
        } else {
          var tag = getTag(value), isFunc = tag == funcTag || tag == genTag;
          if (isBuffer(value)) {
            return cloneBuffer(value, isDeep);
          }
          if (tag == objectTag || tag == argsTag || isFunc && !object) {
            result2 = isFlat || isFunc ? {} : initCloneObject(value);
            if (!isDeep) {
              return isFlat ? copySymbolsIn(value, baseAssignIn(result2, value)) : copySymbols(value, baseAssign(result2, value));
            }
          } else {
            if (!cloneableTags[tag]) {
              return object ? value : {};
            }
            result2 = initCloneByTag(value, tag, isDeep);
          }
        }
        stack || (stack = new Stack);
        var stacked = stack.get(value);
        if (stacked) {
          return stacked;
        }
        stack.set(value, result2);
        if (isSet(value)) {
          value.forEach(function(subValue) {
            result2.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
          });
        } else if (isMap(value)) {
          value.forEach(function(subValue, key2) {
            result2.set(key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
          });
        }
        var keysFunc = isFull ? isFlat ? getAllKeysIn : getAllKeys : isFlat ? keysIn : keys;
        var props = isArr ? undefined2 : keysFunc(value);
        arrayEach(props || value, function(subValue, key2) {
          if (props) {
            key2 = subValue;
            subValue = value[key2];
          }
          assignValue(result2, key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
        });
        return result2;
      }
      function baseConforms(source) {
        var props = keys(source);
        return function(object) {
          return baseConformsTo(object, source, props);
        };
      }
      function baseConformsTo(object, source, props) {
        var length = props.length;
        if (object == null) {
          return !length;
        }
        object = Object2(object);
        while (length--) {
          var key = props[length], predicate = source[key], value = object[key];
          if (value === undefined2 && !(key in object) || !predicate(value)) {
            return false;
          }
        }
        return true;
      }
      function baseDelay(func, wait, args) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        return setTimeout2(function() {
          func.apply(undefined2, args);
        }, wait);
      }
      function baseDifference(array, values2, iteratee2, comparator) {
        var index = -1, includes2 = arrayIncludes, isCommon = true, length = array.length, result2 = [], valuesLength = values2.length;
        if (!length) {
          return result2;
        }
        if (iteratee2) {
          values2 = arrayMap(values2, baseUnary(iteratee2));
        }
        if (comparator) {
          includes2 = arrayIncludesWith;
          isCommon = false;
        } else if (values2.length >= LARGE_ARRAY_SIZE) {
          includes2 = cacheHas;
          isCommon = false;
          values2 = new SetCache(values2);
        }
        outer:
          while (++index < length) {
            var value = array[index], computed = iteratee2 == null ? value : iteratee2(value);
            value = comparator || value !== 0 ? value : 0;
            if (isCommon && computed === computed) {
              var valuesIndex = valuesLength;
              while (valuesIndex--) {
                if (values2[valuesIndex] === computed) {
                  continue outer;
                }
              }
              result2.push(value);
            } else if (!includes2(values2, computed, comparator)) {
              result2.push(value);
            }
          }
        return result2;
      }
      var baseEach = createBaseEach(baseForOwn);
      var baseEachRight = createBaseEach(baseForOwnRight, true);
      function baseEvery(collection, predicate) {
        var result2 = true;
        baseEach(collection, function(value, index, collection2) {
          result2 = !!predicate(value, index, collection2);
          return result2;
        });
        return result2;
      }
      function baseExtremum(array, iteratee2, comparator) {
        var index = -1, length = array.length;
        while (++index < length) {
          var value = array[index], current = iteratee2(value);
          if (current != null && (computed === undefined2 ? current === current && !isSymbol(current) : comparator(current, computed))) {
            var computed = current, result2 = value;
          }
        }
        return result2;
      }
      function baseFill(array, value, start, end) {
        var length = array.length;
        start = toInteger(start);
        if (start < 0) {
          start = -start > length ? 0 : length + start;
        }
        end = end === undefined2 || end > length ? length : toInteger(end);
        if (end < 0) {
          end += length;
        }
        end = start > end ? 0 : toLength(end);
        while (start < end) {
          array[start++] = value;
        }
        return array;
      }
      function baseFilter(collection, predicate) {
        var result2 = [];
        baseEach(collection, function(value, index, collection2) {
          if (predicate(value, index, collection2)) {
            result2.push(value);
          }
        });
        return result2;
      }
      function baseFlatten(array, depth, predicate, isStrict, result2) {
        var index = -1, length = array.length;
        predicate || (predicate = isFlattenable);
        result2 || (result2 = []);
        while (++index < length) {
          var value = array[index];
          if (depth > 0 && predicate(value)) {
            if (depth > 1) {
              baseFlatten(value, depth - 1, predicate, isStrict, result2);
            } else {
              arrayPush(result2, value);
            }
          } else if (!isStrict) {
            result2[result2.length] = value;
          }
        }
        return result2;
      }
      var baseFor = createBaseFor();
      var baseForRight = createBaseFor(true);
      function baseForOwn(object, iteratee2) {
        return object && baseFor(object, iteratee2, keys);
      }
      function baseForOwnRight(object, iteratee2) {
        return object && baseForRight(object, iteratee2, keys);
      }
      function baseFunctions(object, props) {
        return arrayFilter(props, function(key) {
          return isFunction(object[key]);
        });
      }
      function baseGet(object, path) {
        path = castPath(path, object);
        var index = 0, length = path.length;
        while (object != null && index < length) {
          object = object[toKey(path[index++])];
        }
        return index && index == length ? object : undefined2;
      }
      function baseGetAllKeys(object, keysFunc, symbolsFunc) {
        var result2 = keysFunc(object);
        return isArray(object) ? result2 : arrayPush(result2, symbolsFunc(object));
      }
      function baseGetTag(value) {
        if (value == null) {
          return value === undefined2 ? undefinedTag : nullTag;
        }
        return symToStringTag && symToStringTag in Object2(value) ? getRawTag(value) : objectToString(value);
      }
      function baseGt(value, other) {
        return value > other;
      }
      function baseHas(object, key) {
        return object != null && hasOwnProperty.call(object, key);
      }
      function baseHasIn(object, key) {
        return object != null && key in Object2(object);
      }
      function baseInRange(number, start, end) {
        return number >= nativeMin(start, end) && number < nativeMax(start, end);
      }
      function baseIntersection(arrays, iteratee2, comparator) {
        var includes2 = comparator ? arrayIncludesWith : arrayIncludes, length = arrays[0].length, othLength = arrays.length, othIndex = othLength, caches = Array2(othLength), maxLength = Infinity, result2 = [];
        while (othIndex--) {
          var array = arrays[othIndex];
          if (othIndex && iteratee2) {
            array = arrayMap(array, baseUnary(iteratee2));
          }
          maxLength = nativeMin(array.length, maxLength);
          caches[othIndex] = !comparator && (iteratee2 || length >= 120 && array.length >= 120) ? new SetCache(othIndex && array) : undefined2;
        }
        array = arrays[0];
        var index = -1, seen = caches[0];
        outer:
          while (++index < length && result2.length < maxLength) {
            var value = array[index], computed = iteratee2 ? iteratee2(value) : value;
            value = comparator || value !== 0 ? value : 0;
            if (!(seen ? cacheHas(seen, computed) : includes2(result2, computed, comparator))) {
              othIndex = othLength;
              while (--othIndex) {
                var cache = caches[othIndex];
                if (!(cache ? cacheHas(cache, computed) : includes2(arrays[othIndex], computed, comparator))) {
                  continue outer;
                }
              }
              if (seen) {
                seen.push(computed);
              }
              result2.push(value);
            }
          }
        return result2;
      }
      function baseInverter(object, setter, iteratee2, accumulator) {
        baseForOwn(object, function(value, key, object2) {
          setter(accumulator, iteratee2(value), key, object2);
        });
        return accumulator;
      }
      function baseInvoke(object, path, args) {
        path = castPath(path, object);
        object = parent(object, path);
        var func = object == null ? object : object[toKey(last(path))];
        return func == null ? undefined2 : apply(func, object, args);
      }
      function baseIsArguments(value) {
        return isObjectLike(value) && baseGetTag(value) == argsTag;
      }
      function baseIsArrayBuffer(value) {
        return isObjectLike(value) && baseGetTag(value) == arrayBufferTag;
      }
      function baseIsDate(value) {
        return isObjectLike(value) && baseGetTag(value) == dateTag;
      }
      function baseIsEqual(value, other, bitmask, customizer, stack) {
        if (value === other) {
          return true;
        }
        if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
          return value !== value && other !== other;
        }
        return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
      }
      function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
        var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
        objTag = objTag == argsTag ? objectTag : objTag;
        othTag = othTag == argsTag ? objectTag : othTag;
        var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
        if (isSameTag && isBuffer(object)) {
          if (!isBuffer(other)) {
            return false;
          }
          objIsArr = true;
          objIsObj = false;
        }
        if (isSameTag && !objIsObj) {
          stack || (stack = new Stack);
          return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
        }
        if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
          var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
          if (objIsWrapped || othIsWrapped) {
            var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
            stack || (stack = new Stack);
            return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
          }
        }
        if (!isSameTag) {
          return false;
        }
        stack || (stack = new Stack);
        return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
      }
      function baseIsMap(value) {
        return isObjectLike(value) && getTag(value) == mapTag;
      }
      function baseIsMatch(object, source, matchData, customizer) {
        var index = matchData.length, length = index, noCustomizer = !customizer;
        if (object == null) {
          return !length;
        }
        object = Object2(object);
        while (index--) {
          var data = matchData[index];
          if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
            return false;
          }
        }
        while (++index < length) {
          data = matchData[index];
          var key = data[0], objValue = object[key], srcValue = data[1];
          if (noCustomizer && data[2]) {
            if (objValue === undefined2 && !(key in object)) {
              return false;
            }
          } else {
            var stack = new Stack;
            if (customizer) {
              var result2 = customizer(objValue, srcValue, key, object, source, stack);
            }
            if (!(result2 === undefined2 ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack) : result2)) {
              return false;
            }
          }
        }
        return true;
      }
      function baseIsNative(value) {
        if (!isObject(value) || isMasked(value)) {
          return false;
        }
        var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
        return pattern.test(toSource(value));
      }
      function baseIsRegExp(value) {
        return isObjectLike(value) && baseGetTag(value) == regexpTag;
      }
      function baseIsSet(value) {
        return isObjectLike(value) && getTag(value) == setTag;
      }
      function baseIsTypedArray(value) {
        return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
      }
      function baseIteratee(value) {
        if (typeof value == "function") {
          return value;
        }
        if (value == null) {
          return identity;
        }
        if (typeof value == "object") {
          return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
        }
        return property(value);
      }
      function baseKeys(object) {
        if (!isPrototype(object)) {
          return nativeKeys(object);
        }
        var result2 = [];
        for (var key in Object2(object)) {
          if (hasOwnProperty.call(object, key) && key != "constructor") {
            result2.push(key);
          }
        }
        return result2;
      }
      function baseKeysIn(object) {
        if (!isObject(object)) {
          return nativeKeysIn(object);
        }
        var isProto = isPrototype(object), result2 = [];
        for (var key in object) {
          if (!(key == "constructor" && (isProto || !hasOwnProperty.call(object, key)))) {
            result2.push(key);
          }
        }
        return result2;
      }
      function baseLt(value, other) {
        return value < other;
      }
      function baseMap(collection, iteratee2) {
        var index = -1, result2 = isArrayLike(collection) ? Array2(collection.length) : [];
        baseEach(collection, function(value, key, collection2) {
          result2[++index] = iteratee2(value, key, collection2);
        });
        return result2;
      }
      function baseMatches(source) {
        var matchData = getMatchData(source);
        if (matchData.length == 1 && matchData[0][2]) {
          return matchesStrictComparable(matchData[0][0], matchData[0][1]);
        }
        return function(object) {
          return object === source || baseIsMatch(object, source, matchData);
        };
      }
      function baseMatchesProperty(path, srcValue) {
        if (isKey(path) && isStrictComparable(srcValue)) {
          return matchesStrictComparable(toKey(path), srcValue);
        }
        return function(object) {
          var objValue = get(object, path);
          return objValue === undefined2 && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
        };
      }
      function baseMerge(object, source, srcIndex, customizer, stack) {
        if (object === source) {
          return;
        }
        baseFor(source, function(srcValue, key) {
          stack || (stack = new Stack);
          if (isObject(srcValue)) {
            baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
          } else {
            var newValue = customizer ? customizer(safeGet(object, key), srcValue, key + "", object, source, stack) : undefined2;
            if (newValue === undefined2) {
              newValue = srcValue;
            }
            assignMergeValue(object, key, newValue);
          }
        }, keysIn);
      }
      function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
        var objValue = safeGet(object, key), srcValue = safeGet(source, key), stacked = stack.get(srcValue);
        if (stacked) {
          assignMergeValue(object, key, stacked);
          return;
        }
        var newValue = customizer ? customizer(objValue, srcValue, key + "", object, source, stack) : undefined2;
        var isCommon = newValue === undefined2;
        if (isCommon) {
          var isArr = isArray(srcValue), isBuff = !isArr && isBuffer(srcValue), isTyped = !isArr && !isBuff && isTypedArray(srcValue);
          newValue = srcValue;
          if (isArr || isBuff || isTyped) {
            if (isArray(objValue)) {
              newValue = objValue;
            } else if (isArrayLikeObject(objValue)) {
              newValue = copyArray(objValue);
            } else if (isBuff) {
              isCommon = false;
              newValue = cloneBuffer(srcValue, true);
            } else if (isTyped) {
              isCommon = false;
              newValue = cloneTypedArray(srcValue, true);
            } else {
              newValue = [];
            }
          } else if (isPlainObject(srcValue) || isArguments(srcValue)) {
            newValue = objValue;
            if (isArguments(objValue)) {
              newValue = toPlainObject(objValue);
            } else if (!isObject(objValue) || isFunction(objValue)) {
              newValue = initCloneObject(srcValue);
            }
          } else {
            isCommon = false;
          }
        }
        if (isCommon) {
          stack.set(srcValue, newValue);
          mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
          stack["delete"](srcValue);
        }
        assignMergeValue(object, key, newValue);
      }
      function baseNth(array, n) {
        var length = array.length;
        if (!length) {
          return;
        }
        n += n < 0 ? length : 0;
        return isIndex(n, length) ? array[n] : undefined2;
      }
      function baseOrderBy(collection, iteratees, orders) {
        if (iteratees.length) {
          iteratees = arrayMap(iteratees, function(iteratee2) {
            if (isArray(iteratee2)) {
              return function(value) {
                return baseGet(value, iteratee2.length === 1 ? iteratee2[0] : iteratee2);
              };
            }
            return iteratee2;
          });
        } else {
          iteratees = [identity];
        }
        var index = -1;
        iteratees = arrayMap(iteratees, baseUnary(getIteratee()));
        var result2 = baseMap(collection, function(value, key, collection2) {
          var criteria = arrayMap(iteratees, function(iteratee2) {
            return iteratee2(value);
          });
          return { criteria, index: ++index, value };
        });
        return baseSortBy(result2, function(object, other) {
          return compareMultiple(object, other, orders);
        });
      }
      function basePick(object, paths) {
        return basePickBy(object, paths, function(value, path) {
          return hasIn(object, path);
        });
      }
      function basePickBy(object, paths, predicate) {
        var index = -1, length = paths.length, result2 = {};
        while (++index < length) {
          var path = paths[index], value = baseGet(object, path);
          if (predicate(value, path)) {
            baseSet(result2, castPath(path, object), value);
          }
        }
        return result2;
      }
      function basePropertyDeep(path) {
        return function(object) {
          return baseGet(object, path);
        };
      }
      function basePullAll(array, values2, iteratee2, comparator) {
        var indexOf2 = comparator ? baseIndexOfWith : baseIndexOf, index = -1, length = values2.length, seen = array;
        if (array === values2) {
          values2 = copyArray(values2);
        }
        if (iteratee2) {
          seen = arrayMap(array, baseUnary(iteratee2));
        }
        while (++index < length) {
          var fromIndex = 0, value = values2[index], computed = iteratee2 ? iteratee2(value) : value;
          while ((fromIndex = indexOf2(seen, computed, fromIndex, comparator)) > -1) {
            if (seen !== array) {
              splice.call(seen, fromIndex, 1);
            }
            splice.call(array, fromIndex, 1);
          }
        }
        return array;
      }
      function basePullAt(array, indexes) {
        var length = array ? indexes.length : 0, lastIndex = length - 1;
        while (length--) {
          var index = indexes[length];
          if (length == lastIndex || index !== previous) {
            var previous = index;
            if (isIndex(index)) {
              splice.call(array, index, 1);
            } else {
              baseUnset(array, index);
            }
          }
        }
        return array;
      }
      function baseRandom(lower, upper) {
        return lower + nativeFloor(nativeRandom() * (upper - lower + 1));
      }
      function baseRange(start, end, step, fromRight) {
        var index = -1, length = nativeMax(nativeCeil((end - start) / (step || 1)), 0), result2 = Array2(length);
        while (length--) {
          result2[fromRight ? length : ++index] = start;
          start += step;
        }
        return result2;
      }
      function baseRepeat(string, n) {
        var result2 = "";
        if (!string || n < 1 || n > MAX_SAFE_INTEGER) {
          return result2;
        }
        do {
          if (n % 2) {
            result2 += string;
          }
          n = nativeFloor(n / 2);
          if (n) {
            string += string;
          }
        } while (n);
        return result2;
      }
      function baseRest(func, start) {
        return setToString(overRest(func, start, identity), func + "");
      }
      function baseSample(collection) {
        return arraySample(values(collection));
      }
      function baseSampleSize(collection, n) {
        var array = values(collection);
        return shuffleSelf(array, baseClamp(n, 0, array.length));
      }
      function baseSet(object, path, value, customizer) {
        if (!isObject(object)) {
          return object;
        }
        path = castPath(path, object);
        var index = -1, length = path.length, lastIndex = length - 1, nested = object;
        while (nested != null && ++index < length) {
          var key = toKey(path[index]), newValue = value;
          if (key === "__proto__" || key === "constructor" || key === "prototype") {
            return object;
          }
          if (index != lastIndex) {
            var objValue = nested[key];
            newValue = customizer ? customizer(objValue, key, nested) : undefined2;
            if (newValue === undefined2) {
              newValue = isObject(objValue) ? objValue : isIndex(path[index + 1]) ? [] : {};
            }
          }
          assignValue(nested, key, newValue);
          nested = nested[key];
        }
        return object;
      }
      var baseSetData = !metaMap ? identity : function(func, data) {
        metaMap.set(func, data);
        return func;
      };
      var baseSetToString = !defineProperty ? identity : function(func, string) {
        return defineProperty(func, "toString", {
          configurable: true,
          enumerable: false,
          value: constant(string),
          writable: true
        });
      };
      function baseShuffle(collection) {
        return shuffleSelf(values(collection));
      }
      function baseSlice(array, start, end) {
        var index = -1, length = array.length;
        if (start < 0) {
          start = -start > length ? 0 : length + start;
        }
        end = end > length ? length : end;
        if (end < 0) {
          end += length;
        }
        length = start > end ? 0 : end - start >>> 0;
        start >>>= 0;
        var result2 = Array2(length);
        while (++index < length) {
          result2[index] = array[index + start];
        }
        return result2;
      }
      function baseSome(collection, predicate) {
        var result2;
        baseEach(collection, function(value, index, collection2) {
          result2 = predicate(value, index, collection2);
          return !result2;
        });
        return !!result2;
      }
      function baseSortedIndex(array, value, retHighest) {
        var low = 0, high = array == null ? low : array.length;
        if (typeof value == "number" && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
          while (low < high) {
            var mid = low + high >>> 1, computed = array[mid];
            if (computed !== null && !isSymbol(computed) && (retHighest ? computed <= value : computed < value)) {
              low = mid + 1;
            } else {
              high = mid;
            }
          }
          return high;
        }
        return baseSortedIndexBy(array, value, identity, retHighest);
      }
      function baseSortedIndexBy(array, value, iteratee2, retHighest) {
        var low = 0, high = array == null ? 0 : array.length;
        if (high === 0) {
          return 0;
        }
        value = iteratee2(value);
        var valIsNaN = value !== value, valIsNull = value === null, valIsSymbol = isSymbol(value), valIsUndefined = value === undefined2;
        while (low < high) {
          var mid = nativeFloor((low + high) / 2), computed = iteratee2(array[mid]), othIsDefined = computed !== undefined2, othIsNull = computed === null, othIsReflexive = computed === computed, othIsSymbol = isSymbol(computed);
          if (valIsNaN) {
            var setLow = retHighest || othIsReflexive;
          } else if (valIsUndefined) {
            setLow = othIsReflexive && (retHighest || othIsDefined);
          } else if (valIsNull) {
            setLow = othIsReflexive && othIsDefined && (retHighest || !othIsNull);
          } else if (valIsSymbol) {
            setLow = othIsReflexive && othIsDefined && !othIsNull && (retHighest || !othIsSymbol);
          } else if (othIsNull || othIsSymbol) {
            setLow = false;
          } else {
            setLow = retHighest ? computed <= value : computed < value;
          }
          if (setLow) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        return nativeMin(high, MAX_ARRAY_INDEX);
      }
      function baseSortedUniq(array, iteratee2) {
        var index = -1, length = array.length, resIndex = 0, result2 = [];
        while (++index < length) {
          var value = array[index], computed = iteratee2 ? iteratee2(value) : value;
          if (!index || !eq(computed, seen)) {
            var seen = computed;
            result2[resIndex++] = value === 0 ? 0 : value;
          }
        }
        return result2;
      }
      function baseToNumber(value) {
        if (typeof value == "number") {
          return value;
        }
        if (isSymbol(value)) {
          return NAN;
        }
        return +value;
      }
      function baseToString(value) {
        if (typeof value == "string") {
          return value;
        }
        if (isArray(value)) {
          return arrayMap(value, baseToString) + "";
        }
        if (isSymbol(value)) {
          return symbolToString ? symbolToString.call(value) : "";
        }
        var result2 = value + "";
        return result2 == "0" && 1 / value == -INFINITY ? "-0" : result2;
      }
      function baseUniq(array, iteratee2, comparator) {
        var index = -1, includes2 = arrayIncludes, length = array.length, isCommon = true, result2 = [], seen = result2;
        if (comparator) {
          isCommon = false;
          includes2 = arrayIncludesWith;
        } else if (length >= LARGE_ARRAY_SIZE) {
          var set2 = iteratee2 ? null : createSet(array);
          if (set2) {
            return setToArray(set2);
          }
          isCommon = false;
          includes2 = cacheHas;
          seen = new SetCache;
        } else {
          seen = iteratee2 ? [] : result2;
        }
        outer:
          while (++index < length) {
            var value = array[index], computed = iteratee2 ? iteratee2(value) : value;
            value = comparator || value !== 0 ? value : 0;
            if (isCommon && computed === computed) {
              var seenIndex = seen.length;
              while (seenIndex--) {
                if (seen[seenIndex] === computed) {
                  continue outer;
                }
              }
              if (iteratee2) {
                seen.push(computed);
              }
              result2.push(value);
            } else if (!includes2(seen, computed, comparator)) {
              if (seen !== result2) {
                seen.push(computed);
              }
              result2.push(value);
            }
          }
        return result2;
      }
      function baseUnset(object, path) {
        path = castPath(path, object);
        object = parent(object, path);
        return object == null || delete object[toKey(last(path))];
      }
      function baseUpdate(object, path, updater, customizer) {
        return baseSet(object, path, updater(baseGet(object, path)), customizer);
      }
      function baseWhile(array, predicate, isDrop, fromRight) {
        var length = array.length, index = fromRight ? length : -1;
        while ((fromRight ? index-- : ++index < length) && predicate(array[index], index, array)) {}
        return isDrop ? baseSlice(array, fromRight ? 0 : index, fromRight ? index + 1 : length) : baseSlice(array, fromRight ? index + 1 : 0, fromRight ? length : index);
      }
      function baseWrapperValue(value, actions) {
        var result2 = value;
        if (result2 instanceof LazyWrapper) {
          result2 = result2.value();
        }
        return arrayReduce(actions, function(result3, action) {
          return action.func.apply(action.thisArg, arrayPush([result3], action.args));
        }, result2);
      }
      function baseXor(arrays, iteratee2, comparator) {
        var length = arrays.length;
        if (length < 2) {
          return length ? baseUniq(arrays[0]) : [];
        }
        var index = -1, result2 = Array2(length);
        while (++index < length) {
          var array = arrays[index], othIndex = -1;
          while (++othIndex < length) {
            if (othIndex != index) {
              result2[index] = baseDifference(result2[index] || array, arrays[othIndex], iteratee2, comparator);
            }
          }
        }
        return baseUniq(baseFlatten(result2, 1), iteratee2, comparator);
      }
      function baseZipObject(props, values2, assignFunc) {
        var index = -1, length = props.length, valsLength = values2.length, result2 = {};
        while (++index < length) {
          var value = index < valsLength ? values2[index] : undefined2;
          assignFunc(result2, props[index], value);
        }
        return result2;
      }
      function castArrayLikeObject(value) {
        return isArrayLikeObject(value) ? value : [];
      }
      function castFunction(value) {
        return typeof value == "function" ? value : identity;
      }
      function castPath(value, object) {
        if (isArray(value)) {
          return value;
        }
        return isKey(value, object) ? [value] : stringToPath(toString(value));
      }
      var castRest = baseRest;
      function castSlice(array, start, end) {
        var length = array.length;
        end = end === undefined2 ? length : end;
        return !start && end >= length ? array : baseSlice(array, start, end);
      }
      var clearTimeout2 = ctxClearTimeout || function(id) {
        return root.clearTimeout(id);
      };
      function cloneBuffer(buffer, isDeep) {
        if (isDeep) {
          return buffer.slice();
        }
        var length = buffer.length, result2 = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
        buffer.copy(result2);
        return result2;
      }
      function cloneArrayBuffer(arrayBuffer) {
        var result2 = new arrayBuffer.constructor(arrayBuffer.byteLength);
        new Uint8Array2(result2).set(new Uint8Array2(arrayBuffer));
        return result2;
      }
      function cloneDataView(dataView, isDeep) {
        var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
        return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
      }
      function cloneRegExp(regexp) {
        var result2 = new regexp.constructor(regexp.source, reFlags.exec(regexp));
        result2.lastIndex = regexp.lastIndex;
        return result2;
      }
      function cloneSymbol(symbol) {
        return symbolValueOf ? Object2(symbolValueOf.call(symbol)) : {};
      }
      function cloneTypedArray(typedArray, isDeep) {
        var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
        return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
      }
      function compareAscending(value, other) {
        if (value !== other) {
          var valIsDefined = value !== undefined2, valIsNull = value === null, valIsReflexive = value === value, valIsSymbol = isSymbol(value);
          var othIsDefined = other !== undefined2, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol(other);
          if (!othIsNull && !othIsSymbol && !valIsSymbol && value > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) {
            return 1;
          }
          if (!valIsNull && !valIsSymbol && !othIsSymbol && value < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) {
            return -1;
          }
        }
        return 0;
      }
      function compareMultiple(object, other, orders) {
        var index = -1, objCriteria = object.criteria, othCriteria = other.criteria, length = objCriteria.length, ordersLength = orders.length;
        while (++index < length) {
          var result2 = compareAscending(objCriteria[index], othCriteria[index]);
          if (result2) {
            if (index >= ordersLength) {
              return result2;
            }
            var order = orders[index];
            return result2 * (order == "desc" ? -1 : 1);
          }
        }
        return object.index - other.index;
      }
      function composeArgs(args, partials, holders, isCurried) {
        var argsIndex = -1, argsLength = args.length, holdersLength = holders.length, leftIndex = -1, leftLength = partials.length, rangeLength = nativeMax(argsLength - holdersLength, 0), result2 = Array2(leftLength + rangeLength), isUncurried = !isCurried;
        while (++leftIndex < leftLength) {
          result2[leftIndex] = partials[leftIndex];
        }
        while (++argsIndex < holdersLength) {
          if (isUncurried || argsIndex < argsLength) {
            result2[holders[argsIndex]] = args[argsIndex];
          }
        }
        while (rangeLength--) {
          result2[leftIndex++] = args[argsIndex++];
        }
        return result2;
      }
      function composeArgsRight(args, partials, holders, isCurried) {
        var argsIndex = -1, argsLength = args.length, holdersIndex = -1, holdersLength = holders.length, rightIndex = -1, rightLength = partials.length, rangeLength = nativeMax(argsLength - holdersLength, 0), result2 = Array2(rangeLength + rightLength), isUncurried = !isCurried;
        while (++argsIndex < rangeLength) {
          result2[argsIndex] = args[argsIndex];
        }
        var offset = argsIndex;
        while (++rightIndex < rightLength) {
          result2[offset + rightIndex] = partials[rightIndex];
        }
        while (++holdersIndex < holdersLength) {
          if (isUncurried || argsIndex < argsLength) {
            result2[offset + holders[holdersIndex]] = args[argsIndex++];
          }
        }
        return result2;
      }
      function copyArray(source, array) {
        var index = -1, length = source.length;
        array || (array = Array2(length));
        while (++index < length) {
          array[index] = source[index];
        }
        return array;
      }
      function copyObject(source, props, object, customizer) {
        var isNew = !object;
        object || (object = {});
        var index = -1, length = props.length;
        while (++index < length) {
          var key = props[index];
          var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined2;
          if (newValue === undefined2) {
            newValue = source[key];
          }
          if (isNew) {
            baseAssignValue(object, key, newValue);
          } else {
            assignValue(object, key, newValue);
          }
        }
        return object;
      }
      function copySymbols(source, object) {
        return copyObject(source, getSymbols(source), object);
      }
      function copySymbolsIn(source, object) {
        return copyObject(source, getSymbolsIn(source), object);
      }
      function createAggregator(setter, initializer) {
        return function(collection, iteratee2) {
          var func = isArray(collection) ? arrayAggregator : baseAggregator, accumulator = initializer ? initializer() : {};
          return func(collection, setter, getIteratee(iteratee2, 2), accumulator);
        };
      }
      function createAssigner(assigner) {
        return baseRest(function(object, sources) {
          var index = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : undefined2, guard = length > 2 ? sources[2] : undefined2;
          customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : undefined2;
          if (guard && isIterateeCall(sources[0], sources[1], guard)) {
            customizer = length < 3 ? undefined2 : customizer;
            length = 1;
          }
          object = Object2(object);
          while (++index < length) {
            var source = sources[index];
            if (source) {
              assigner(object, source, index, customizer);
            }
          }
          return object;
        });
      }
      function createBaseEach(eachFunc, fromRight) {
        return function(collection, iteratee2) {
          if (collection == null) {
            return collection;
          }
          if (!isArrayLike(collection)) {
            return eachFunc(collection, iteratee2);
          }
          var length = collection.length, index = fromRight ? length : -1, iterable = Object2(collection);
          while (fromRight ? index-- : ++index < length) {
            if (iteratee2(iterable[index], index, iterable) === false) {
              break;
            }
          }
          return collection;
        };
      }
      function createBaseFor(fromRight) {
        return function(object, iteratee2, keysFunc) {
          var index = -1, iterable = Object2(object), props = keysFunc(object), length = props.length;
          while (length--) {
            var key = props[fromRight ? length : ++index];
            if (iteratee2(iterable[key], key, iterable) === false) {
              break;
            }
          }
          return object;
        };
      }
      function createBind(func, bitmask, thisArg) {
        var isBind = bitmask & WRAP_BIND_FLAG, Ctor = createCtor(func);
        function wrapper() {
          var fn = this && this !== root && this instanceof wrapper ? Ctor : func;
          return fn.apply(isBind ? thisArg : this, arguments);
        }
        return wrapper;
      }
      function createCaseFirst(methodName) {
        return function(string) {
          string = toString(string);
          var strSymbols = hasUnicode(string) ? stringToArray(string) : undefined2;
          var chr = strSymbols ? strSymbols[0] : string.charAt(0);
          var trailing = strSymbols ? castSlice(strSymbols, 1).join("") : string.slice(1);
          return chr[methodName]() + trailing;
        };
      }
      function createCompounder(callback) {
        return function(string) {
          return arrayReduce(words(deburr(string).replace(reApos, "")), callback, "");
        };
      }
      function createCtor(Ctor) {
        return function() {
          var args = arguments;
          switch (args.length) {
            case 0:
              return new Ctor;
            case 1:
              return new Ctor(args[0]);
            case 2:
              return new Ctor(args[0], args[1]);
            case 3:
              return new Ctor(args[0], args[1], args[2]);
            case 4:
              return new Ctor(args[0], args[1], args[2], args[3]);
            case 5:
              return new Ctor(args[0], args[1], args[2], args[3], args[4]);
            case 6:
              return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
            case 7:
              return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
          }
          var thisBinding = baseCreate(Ctor.prototype), result2 = Ctor.apply(thisBinding, args);
          return isObject(result2) ? result2 : thisBinding;
        };
      }
      function createCurry(func, bitmask, arity) {
        var Ctor = createCtor(func);
        function wrapper() {
          var length = arguments.length, args = Array2(length), index = length, placeholder = getHolder(wrapper);
          while (index--) {
            args[index] = arguments[index];
          }
          var holders = length < 3 && args[0] !== placeholder && args[length - 1] !== placeholder ? [] : replaceHolders(args, placeholder);
          length -= holders.length;
          if (length < arity) {
            return createRecurry(func, bitmask, createHybrid, wrapper.placeholder, undefined2, args, holders, undefined2, undefined2, arity - length);
          }
          var fn = this && this !== root && this instanceof wrapper ? Ctor : func;
          return apply(fn, this, args);
        }
        return wrapper;
      }
      function createFind(findIndexFunc) {
        return function(collection, predicate, fromIndex) {
          var iterable = Object2(collection);
          if (!isArrayLike(collection)) {
            var iteratee2 = getIteratee(predicate, 3);
            collection = keys(collection);
            predicate = function(key) {
              return iteratee2(iterable[key], key, iterable);
            };
          }
          var index = findIndexFunc(collection, predicate, fromIndex);
          return index > -1 ? iterable[iteratee2 ? collection[index] : index] : undefined2;
        };
      }
      function createFlow(fromRight) {
        return flatRest(function(funcs) {
          var length = funcs.length, index = length, prereq = LodashWrapper.prototype.thru;
          if (fromRight) {
            funcs.reverse();
          }
          while (index--) {
            var func = funcs[index];
            if (typeof func != "function") {
              throw new TypeError2(FUNC_ERROR_TEXT);
            }
            if (prereq && !wrapper && getFuncName(func) == "wrapper") {
              var wrapper = new LodashWrapper([], true);
            }
          }
          index = wrapper ? index : length;
          while (++index < length) {
            func = funcs[index];
            var funcName = getFuncName(func), data = funcName == "wrapper" ? getData(func) : undefined2;
            if (data && isLaziable(data[0]) && data[1] == (WRAP_ARY_FLAG | WRAP_CURRY_FLAG | WRAP_PARTIAL_FLAG | WRAP_REARG_FLAG) && !data[4].length && data[9] == 1) {
              wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
            } else {
              wrapper = func.length == 1 && isLaziable(func) ? wrapper[funcName]() : wrapper.thru(func);
            }
          }
          return function() {
            var args = arguments, value = args[0];
            if (wrapper && args.length == 1 && isArray(value)) {
              return wrapper.plant(value).value();
            }
            var index2 = 0, result2 = length ? funcs[index2].apply(this, args) : value;
            while (++index2 < length) {
              result2 = funcs[index2].call(this, result2);
            }
            return result2;
          };
        });
      }
      function createHybrid(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary2, arity) {
        var isAry = bitmask & WRAP_ARY_FLAG, isBind = bitmask & WRAP_BIND_FLAG, isBindKey = bitmask & WRAP_BIND_KEY_FLAG, isCurried = bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG), isFlip = bitmask & WRAP_FLIP_FLAG, Ctor = isBindKey ? undefined2 : createCtor(func);
        function wrapper() {
          var length = arguments.length, args = Array2(length), index = length;
          while (index--) {
            args[index] = arguments[index];
          }
          if (isCurried) {
            var placeholder = getHolder(wrapper), holdersCount = countHolders(args, placeholder);
          }
          if (partials) {
            args = composeArgs(args, partials, holders, isCurried);
          }
          if (partialsRight) {
            args = composeArgsRight(args, partialsRight, holdersRight, isCurried);
          }
          length -= holdersCount;
          if (isCurried && length < arity) {
            var newHolders = replaceHolders(args, placeholder);
            return createRecurry(func, bitmask, createHybrid, wrapper.placeholder, thisArg, args, newHolders, argPos, ary2, arity - length);
          }
          var thisBinding = isBind ? thisArg : this, fn = isBindKey ? thisBinding[func] : func;
          length = args.length;
          if (argPos) {
            args = reorder(args, argPos);
          } else if (isFlip && length > 1) {
            args.reverse();
          }
          if (isAry && ary2 < length) {
            args.length = ary2;
          }
          if (this && this !== root && this instanceof wrapper) {
            fn = Ctor || createCtor(fn);
          }
          return fn.apply(thisBinding, args);
        }
        return wrapper;
      }
      function createInverter(setter, toIteratee) {
        return function(object, iteratee2) {
          return baseInverter(object, setter, toIteratee(iteratee2), {});
        };
      }
      function createMathOperation(operator, defaultValue) {
        return function(value, other) {
          var result2;
          if (value === undefined2 && other === undefined2) {
            return defaultValue;
          }
          if (value !== undefined2) {
            result2 = value;
          }
          if (other !== undefined2) {
            if (result2 === undefined2) {
              return other;
            }
            if (typeof value == "string" || typeof other == "string") {
              value = baseToString(value);
              other = baseToString(other);
            } else {
              value = baseToNumber(value);
              other = baseToNumber(other);
            }
            result2 = operator(value, other);
          }
          return result2;
        };
      }
      function createOver(arrayFunc) {
        return flatRest(function(iteratees) {
          iteratees = arrayMap(iteratees, baseUnary(getIteratee()));
          return baseRest(function(args) {
            var thisArg = this;
            return arrayFunc(iteratees, function(iteratee2) {
              return apply(iteratee2, thisArg, args);
            });
          });
        });
      }
      function createPadding(length, chars) {
        chars = chars === undefined2 ? " " : baseToString(chars);
        var charsLength = chars.length;
        if (charsLength < 2) {
          return charsLength ? baseRepeat(chars, length) : chars;
        }
        var result2 = baseRepeat(chars, nativeCeil(length / stringSize(chars)));
        return hasUnicode(chars) ? castSlice(stringToArray(result2), 0, length).join("") : result2.slice(0, length);
      }
      function createPartial(func, bitmask, thisArg, partials) {
        var isBind = bitmask & WRAP_BIND_FLAG, Ctor = createCtor(func);
        function wrapper() {
          var argsIndex = -1, argsLength = arguments.length, leftIndex = -1, leftLength = partials.length, args = Array2(leftLength + argsLength), fn = this && this !== root && this instanceof wrapper ? Ctor : func;
          while (++leftIndex < leftLength) {
            args[leftIndex] = partials[leftIndex];
          }
          while (argsLength--) {
            args[leftIndex++] = arguments[++argsIndex];
          }
          return apply(fn, isBind ? thisArg : this, args);
        }
        return wrapper;
      }
      function createRange(fromRight) {
        return function(start, end, step) {
          if (step && typeof step != "number" && isIterateeCall(start, end, step)) {
            end = step = undefined2;
          }
          start = toFinite(start);
          if (end === undefined2) {
            end = start;
            start = 0;
          } else {
            end = toFinite(end);
          }
          step = step === undefined2 ? start < end ? 1 : -1 : toFinite(step);
          return baseRange(start, end, step, fromRight);
        };
      }
      function createRelationalOperation(operator) {
        return function(value, other) {
          if (!(typeof value == "string" && typeof other == "string")) {
            value = toNumber(value);
            other = toNumber(other);
          }
          return operator(value, other);
        };
      }
      function createRecurry(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary2, arity) {
        var isCurry = bitmask & WRAP_CURRY_FLAG, newHolders = isCurry ? holders : undefined2, newHoldersRight = isCurry ? undefined2 : holders, newPartials = isCurry ? partials : undefined2, newPartialsRight = isCurry ? undefined2 : partials;
        bitmask |= isCurry ? WRAP_PARTIAL_FLAG : WRAP_PARTIAL_RIGHT_FLAG;
        bitmask &= ~(isCurry ? WRAP_PARTIAL_RIGHT_FLAG : WRAP_PARTIAL_FLAG);
        if (!(bitmask & WRAP_CURRY_BOUND_FLAG)) {
          bitmask &= ~(WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG);
        }
        var newData = [
          func,
          bitmask,
          thisArg,
          newPartials,
          newHolders,
          newPartialsRight,
          newHoldersRight,
          argPos,
          ary2,
          arity
        ];
        var result2 = wrapFunc.apply(undefined2, newData);
        if (isLaziable(func)) {
          setData(result2, newData);
        }
        result2.placeholder = placeholder;
        return setWrapToString(result2, func, bitmask);
      }
      function createRound(methodName) {
        var func = Math2[methodName];
        return function(number, precision) {
          number = toNumber(number);
          precision = precision == null ? 0 : nativeMin(toInteger(precision), 292);
          if (precision && nativeIsFinite(number)) {
            var pair = (toString(number) + "e").split("e"), value = func(pair[0] + "e" + (+pair[1] + precision));
            pair = (toString(value) + "e").split("e");
            return +(pair[0] + "e" + (+pair[1] - precision));
          }
          return func(number);
        };
      }
      var createSet = !(Set2 && 1 / setToArray(new Set2([, -0]))[1] == INFINITY) ? noop : function(values2) {
        return new Set2(values2);
      };
      function createToPairs(keysFunc) {
        return function(object) {
          var tag = getTag(object);
          if (tag == mapTag) {
            return mapToArray(object);
          }
          if (tag == setTag) {
            return setToPairs(object);
          }
          return baseToPairs(object, keysFunc(object));
        };
      }
      function createWrap(func, bitmask, thisArg, partials, holders, argPos, ary2, arity) {
        var isBindKey = bitmask & WRAP_BIND_KEY_FLAG;
        if (!isBindKey && typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        var length = partials ? partials.length : 0;
        if (!length) {
          bitmask &= ~(WRAP_PARTIAL_FLAG | WRAP_PARTIAL_RIGHT_FLAG);
          partials = holders = undefined2;
        }
        ary2 = ary2 === undefined2 ? ary2 : nativeMax(toInteger(ary2), 0);
        arity = arity === undefined2 ? arity : toInteger(arity);
        length -= holders ? holders.length : 0;
        if (bitmask & WRAP_PARTIAL_RIGHT_FLAG) {
          var partialsRight = partials, holdersRight = holders;
          partials = holders = undefined2;
        }
        var data = isBindKey ? undefined2 : getData(func);
        var newData = [
          func,
          bitmask,
          thisArg,
          partials,
          holders,
          partialsRight,
          holdersRight,
          argPos,
          ary2,
          arity
        ];
        if (data) {
          mergeData(newData, data);
        }
        func = newData[0];
        bitmask = newData[1];
        thisArg = newData[2];
        partials = newData[3];
        holders = newData[4];
        arity = newData[9] = newData[9] === undefined2 ? isBindKey ? 0 : func.length : nativeMax(newData[9] - length, 0);
        if (!arity && bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG)) {
          bitmask &= ~(WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG);
        }
        if (!bitmask || bitmask == WRAP_BIND_FLAG) {
          var result2 = createBind(func, bitmask, thisArg);
        } else if (bitmask == WRAP_CURRY_FLAG || bitmask == WRAP_CURRY_RIGHT_FLAG) {
          result2 = createCurry(func, bitmask, arity);
        } else if ((bitmask == WRAP_PARTIAL_FLAG || bitmask == (WRAP_BIND_FLAG | WRAP_PARTIAL_FLAG)) && !holders.length) {
          result2 = createPartial(func, bitmask, thisArg, partials);
        } else {
          result2 = createHybrid.apply(undefined2, newData);
        }
        var setter = data ? baseSetData : setData;
        return setWrapToString(setter(result2, newData), func, bitmask);
      }
      function customDefaultsAssignIn(objValue, srcValue, key, object) {
        if (objValue === undefined2 || eq(objValue, objectProto[key]) && !hasOwnProperty.call(object, key)) {
          return srcValue;
        }
        return objValue;
      }
      function customDefaultsMerge(objValue, srcValue, key, object, source, stack) {
        if (isObject(objValue) && isObject(srcValue)) {
          stack.set(srcValue, objValue);
          baseMerge(objValue, srcValue, undefined2, customDefaultsMerge, stack);
          stack["delete"](srcValue);
        }
        return objValue;
      }
      function customOmitClone(value) {
        return isPlainObject(value) ? undefined2 : value;
      }
      function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
        if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
          return false;
        }
        var arrStacked = stack.get(array);
        var othStacked = stack.get(other);
        if (arrStacked && othStacked) {
          return arrStacked == other && othStacked == array;
        }
        var index = -1, result2 = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache : undefined2;
        stack.set(array, other);
        stack.set(other, array);
        while (++index < arrLength) {
          var arrValue = array[index], othValue = other[index];
          if (customizer) {
            var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
          }
          if (compared !== undefined2) {
            if (compared) {
              continue;
            }
            result2 = false;
            break;
          }
          if (seen) {
            if (!arraySome(other, function(othValue2, othIndex) {
              if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
                return seen.push(othIndex);
              }
            })) {
              result2 = false;
              break;
            }
          } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
            result2 = false;
            break;
          }
        }
        stack["delete"](array);
        stack["delete"](other);
        return result2;
      }
      function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
        switch (tag) {
          case dataViewTag:
            if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
              return false;
            }
            object = object.buffer;
            other = other.buffer;
          case arrayBufferTag:
            if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object), new Uint8Array2(other))) {
              return false;
            }
            return true;
          case boolTag:
          case dateTag:
          case numberTag:
            return eq(+object, +other);
          case errorTag:
            return object.name == other.name && object.message == other.message;
          case regexpTag:
          case stringTag:
            return object == other + "";
          case mapTag:
            var convert = mapToArray;
          case setTag:
            var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
            convert || (convert = setToArray);
            if (object.size != other.size && !isPartial) {
              return false;
            }
            var stacked = stack.get(object);
            if (stacked) {
              return stacked == other;
            }
            bitmask |= COMPARE_UNORDERED_FLAG;
            stack.set(object, other);
            var result2 = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
            stack["delete"](object);
            return result2;
          case symbolTag:
            if (symbolValueOf) {
              return symbolValueOf.call(object) == symbolValueOf.call(other);
            }
        }
        return false;
      }
      function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
        if (objLength != othLength && !isPartial) {
          return false;
        }
        var index = objLength;
        while (index--) {
          var key = objProps[index];
          if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
            return false;
          }
        }
        var objStacked = stack.get(object);
        var othStacked = stack.get(other);
        if (objStacked && othStacked) {
          return objStacked == other && othStacked == object;
        }
        var result2 = true;
        stack.set(object, other);
        stack.set(other, object);
        var skipCtor = isPartial;
        while (++index < objLength) {
          key = objProps[index];
          var objValue = object[key], othValue = other[key];
          if (customizer) {
            var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
          }
          if (!(compared === undefined2 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
            result2 = false;
            break;
          }
          skipCtor || (skipCtor = key == "constructor");
        }
        if (result2 && !skipCtor) {
          var objCtor = object.constructor, othCtor = other.constructor;
          if (objCtor != othCtor && (("constructor" in object) && ("constructor" in other)) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
            result2 = false;
          }
        }
        stack["delete"](object);
        stack["delete"](other);
        return result2;
      }
      function flatRest(func) {
        return setToString(overRest(func, undefined2, flatten), func + "");
      }
      function getAllKeys(object) {
        return baseGetAllKeys(object, keys, getSymbols);
      }
      function getAllKeysIn(object) {
        return baseGetAllKeys(object, keysIn, getSymbolsIn);
      }
      var getData = !metaMap ? noop : function(func) {
        return metaMap.get(func);
      };
      function getFuncName(func) {
        var result2 = func.name + "", array = realNames[result2], length = hasOwnProperty.call(realNames, result2) ? array.length : 0;
        while (length--) {
          var data = array[length], otherFunc = data.func;
          if (otherFunc == null || otherFunc == func) {
            return data.name;
          }
        }
        return result2;
      }
      function getHolder(func) {
        var object = hasOwnProperty.call(lodash, "placeholder") ? lodash : func;
        return object.placeholder;
      }
      function getIteratee() {
        var result2 = lodash.iteratee || iteratee;
        result2 = result2 === iteratee ? baseIteratee : result2;
        return arguments.length ? result2(arguments[0], arguments[1]) : result2;
      }
      function getMapData(map2, key) {
        var data = map2.__data__;
        return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
      }
      function getMatchData(object) {
        var result2 = keys(object), length = result2.length;
        while (length--) {
          var key = result2[length], value = object[key];
          result2[length] = [key, value, isStrictComparable(value)];
        }
        return result2;
      }
      function getNative(object, key) {
        var value = getValue(object, key);
        return baseIsNative(value) ? value : undefined2;
      }
      function getRawTag(value) {
        var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
        try {
          value[symToStringTag] = undefined2;
          var unmasked = true;
        } catch (e) {}
        var result2 = nativeObjectToString.call(value);
        if (unmasked) {
          if (isOwn) {
            value[symToStringTag] = tag;
          } else {
            delete value[symToStringTag];
          }
        }
        return result2;
      }
      var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
        if (object == null) {
          return [];
        }
        object = Object2(object);
        return arrayFilter(nativeGetSymbols(object), function(symbol) {
          return propertyIsEnumerable.call(object, symbol);
        });
      };
      var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
        var result2 = [];
        while (object) {
          arrayPush(result2, getSymbols(object));
          object = getPrototype(object);
        }
        return result2;
      };
      var getTag = baseGetTag;
      if (DataView2 && getTag(new DataView2(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2) != setTag || WeakMap2 && getTag(new WeakMap2) != weakMapTag) {
        getTag = function(value) {
          var result2 = baseGetTag(value), Ctor = result2 == objectTag ? value.constructor : undefined2, ctorString = Ctor ? toSource(Ctor) : "";
          if (ctorString) {
            switch (ctorString) {
              case dataViewCtorString:
                return dataViewTag;
              case mapCtorString:
                return mapTag;
              case promiseCtorString:
                return promiseTag;
              case setCtorString:
                return setTag;
              case weakMapCtorString:
                return weakMapTag;
            }
          }
          return result2;
        };
      }
      function getView(start, end, transforms) {
        var index = -1, length = transforms.length;
        while (++index < length) {
          var data = transforms[index], size2 = data.size;
          switch (data.type) {
            case "drop":
              start += size2;
              break;
            case "dropRight":
              end -= size2;
              break;
            case "take":
              end = nativeMin(end, start + size2);
              break;
            case "takeRight":
              start = nativeMax(start, end - size2);
              break;
          }
        }
        return { start, end };
      }
      function getWrapDetails(source) {
        var match = source.match(reWrapDetails);
        return match ? match[1].split(reSplitDetails) : [];
      }
      function hasPath(object, path, hasFunc) {
        path = castPath(path, object);
        var index = -1, length = path.length, result2 = false;
        while (++index < length) {
          var key = toKey(path[index]);
          if (!(result2 = object != null && hasFunc(object, key))) {
            break;
          }
          object = object[key];
        }
        if (result2 || ++index != length) {
          return result2;
        }
        length = object == null ? 0 : object.length;
        return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
      }
      function initCloneArray(array) {
        var length = array.length, result2 = new array.constructor(length);
        if (length && typeof array[0] == "string" && hasOwnProperty.call(array, "index")) {
          result2.index = array.index;
          result2.input = array.input;
        }
        return result2;
      }
      function initCloneObject(object) {
        return typeof object.constructor == "function" && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
      }
      function initCloneByTag(object, tag, isDeep) {
        var Ctor = object.constructor;
        switch (tag) {
          case arrayBufferTag:
            return cloneArrayBuffer(object);
          case boolTag:
          case dateTag:
            return new Ctor(+object);
          case dataViewTag:
            return cloneDataView(object, isDeep);
          case float32Tag:
          case float64Tag:
          case int8Tag:
          case int16Tag:
          case int32Tag:
          case uint8Tag:
          case uint8ClampedTag:
          case uint16Tag:
          case uint32Tag:
            return cloneTypedArray(object, isDeep);
          case mapTag:
            return new Ctor;
          case numberTag:
          case stringTag:
            return new Ctor(object);
          case regexpTag:
            return cloneRegExp(object);
          case setTag:
            return new Ctor;
          case symbolTag:
            return cloneSymbol(object);
        }
      }
      function insertWrapDetails(source, details) {
        var length = details.length;
        if (!length) {
          return source;
        }
        var lastIndex = length - 1;
        details[lastIndex] = (length > 1 ? "& " : "") + details[lastIndex];
        details = details.join(length > 2 ? ", " : " ");
        return source.replace(reWrapComment, `{
/* [wrapped with ` + details + `] */
`);
      }
      function isFlattenable(value) {
        return isArray(value) || isArguments(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
      }
      function isIndex(value, length) {
        var type = typeof value;
        length = length == null ? MAX_SAFE_INTEGER : length;
        return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
      }
      function isIterateeCall(value, index, object) {
        if (!isObject(object)) {
          return false;
        }
        var type = typeof index;
        if (type == "number" ? isArrayLike(object) && isIndex(index, object.length) : type == "string" && (index in object)) {
          return eq(object[index], value);
        }
        return false;
      }
      function isKey(value, object) {
        if (isArray(value)) {
          return false;
        }
        var type = typeof value;
        if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
          return true;
        }
        return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object2(object);
      }
      function isKeyable(value) {
        var type = typeof value;
        return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
      }
      function isLaziable(func) {
        var funcName = getFuncName(func), other = lodash[funcName];
        if (typeof other != "function" || !(funcName in LazyWrapper.prototype)) {
          return false;
        }
        if (func === other) {
          return true;
        }
        var data = getData(other);
        return !!data && func === data[0];
      }
      function isMasked(func) {
        return !!maskSrcKey && maskSrcKey in func;
      }
      var isMaskable = coreJsData ? isFunction : stubFalse;
      function isPrototype(value) {
        var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
        return value === proto;
      }
      function isStrictComparable(value) {
        return value === value && !isObject(value);
      }
      function matchesStrictComparable(key, srcValue) {
        return function(object) {
          if (object == null) {
            return false;
          }
          return object[key] === srcValue && (srcValue !== undefined2 || (key in Object2(object)));
        };
      }
      function memoizeCapped(func) {
        var result2 = memoize(func, function(key) {
          if (cache.size === MAX_MEMOIZE_SIZE) {
            cache.clear();
          }
          return key;
        });
        var cache = result2.cache;
        return result2;
      }
      function mergeData(data, source) {
        var bitmask = data[1], srcBitmask = source[1], newBitmask = bitmask | srcBitmask, isCommon = newBitmask < (WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG | WRAP_ARY_FLAG);
        var isCombo = srcBitmask == WRAP_ARY_FLAG && bitmask == WRAP_CURRY_FLAG || srcBitmask == WRAP_ARY_FLAG && bitmask == WRAP_REARG_FLAG && data[7].length <= source[8] || srcBitmask == (WRAP_ARY_FLAG | WRAP_REARG_FLAG) && source[7].length <= source[8] && bitmask == WRAP_CURRY_FLAG;
        if (!(isCommon || isCombo)) {
          return data;
        }
        if (srcBitmask & WRAP_BIND_FLAG) {
          data[2] = source[2];
          newBitmask |= bitmask & WRAP_BIND_FLAG ? 0 : WRAP_CURRY_BOUND_FLAG;
        }
        var value = source[3];
        if (value) {
          var partials = data[3];
          data[3] = partials ? composeArgs(partials, value, source[4]) : value;
          data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : source[4];
        }
        value = source[5];
        if (value) {
          partials = data[5];
          data[5] = partials ? composeArgsRight(partials, value, source[6]) : value;
          data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : source[6];
        }
        value = source[7];
        if (value) {
          data[7] = value;
        }
        if (srcBitmask & WRAP_ARY_FLAG) {
          data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
        }
        if (data[9] == null) {
          data[9] = source[9];
        }
        data[0] = source[0];
        data[1] = newBitmask;
        return data;
      }
      function nativeKeysIn(object) {
        var result2 = [];
        if (object != null) {
          for (var key in Object2(object)) {
            result2.push(key);
          }
        }
        return result2;
      }
      function objectToString(value) {
        return nativeObjectToString.call(value);
      }
      function overRest(func, start, transform2) {
        start = nativeMax(start === undefined2 ? func.length - 1 : start, 0);
        return function() {
          var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array2(length);
          while (++index < length) {
            array[index] = args[start + index];
          }
          index = -1;
          var otherArgs = Array2(start + 1);
          while (++index < start) {
            otherArgs[index] = args[index];
          }
          otherArgs[start] = transform2(array);
          return apply(func, this, otherArgs);
        };
      }
      function parent(object, path) {
        return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
      }
      function reorder(array, indexes) {
        var arrLength = array.length, length = nativeMin(indexes.length, arrLength), oldArray = copyArray(array);
        while (length--) {
          var index = indexes[length];
          array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined2;
        }
        return array;
      }
      function safeGet(object, key) {
        if (key === "constructor" && typeof object[key] === "function") {
          return;
        }
        if (key == "__proto__") {
          return;
        }
        return object[key];
      }
      var setData = shortOut(baseSetData);
      var setTimeout2 = ctxSetTimeout || function(func, wait) {
        return root.setTimeout(func, wait);
      };
      var setToString = shortOut(baseSetToString);
      function setWrapToString(wrapper, reference, bitmask) {
        var source = reference + "";
        return setToString(wrapper, insertWrapDetails(source, updateWrapDetails(getWrapDetails(source), bitmask)));
      }
      function shortOut(func) {
        var count = 0, lastCalled = 0;
        return function() {
          var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
          lastCalled = stamp;
          if (remaining > 0) {
            if (++count >= HOT_COUNT) {
              return arguments[0];
            }
          } else {
            count = 0;
          }
          return func.apply(undefined2, arguments);
        };
      }
      function shuffleSelf(array, size2) {
        var index = -1, length = array.length, lastIndex = length - 1;
        size2 = size2 === undefined2 ? length : size2;
        while (++index < size2) {
          var rand = baseRandom(index, lastIndex), value = array[rand];
          array[rand] = array[index];
          array[index] = value;
        }
        array.length = size2;
        return array;
      }
      var stringToPath = memoizeCapped(function(string) {
        var result2 = [];
        if (string.charCodeAt(0) === 46) {
          result2.push("");
        }
        string.replace(rePropName, function(match, number, quote, subString) {
          result2.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
        });
        return result2;
      });
      function toKey(value) {
        if (typeof value == "string" || isSymbol(value)) {
          return value;
        }
        var result2 = value + "";
        return result2 == "0" && 1 / value == -INFINITY ? "-0" : result2;
      }
      function toSource(func) {
        if (func != null) {
          try {
            return funcToString.call(func);
          } catch (e) {}
          try {
            return func + "";
          } catch (e) {}
        }
        return "";
      }
      function updateWrapDetails(details, bitmask) {
        arrayEach(wrapFlags, function(pair) {
          var value = "_." + pair[0];
          if (bitmask & pair[1] && !arrayIncludes(details, value)) {
            details.push(value);
          }
        });
        return details.sort();
      }
      function wrapperClone(wrapper) {
        if (wrapper instanceof LazyWrapper) {
          return wrapper.clone();
        }
        var result2 = new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__);
        result2.__actions__ = copyArray(wrapper.__actions__);
        result2.__index__ = wrapper.__index__;
        result2.__values__ = wrapper.__values__;
        return result2;
      }
      function chunk(array, size2, guard) {
        if (guard ? isIterateeCall(array, size2, guard) : size2 === undefined2) {
          size2 = 1;
        } else {
          size2 = nativeMax(toInteger(size2), 0);
        }
        var length = array == null ? 0 : array.length;
        if (!length || size2 < 1) {
          return [];
        }
        var index = 0, resIndex = 0, result2 = Array2(nativeCeil(length / size2));
        while (index < length) {
          result2[resIndex++] = baseSlice(array, index, index += size2);
        }
        return result2;
      }
      function compact(array) {
        var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result2 = [];
        while (++index < length) {
          var value = array[index];
          if (value) {
            result2[resIndex++] = value;
          }
        }
        return result2;
      }
      function concat() {
        var length = arguments.length;
        if (!length) {
          return [];
        }
        var args = Array2(length - 1), array = arguments[0], index = length;
        while (index--) {
          args[index - 1] = arguments[index];
        }
        return arrayPush(isArray(array) ? copyArray(array) : [array], baseFlatten(args, 1));
      }
      var difference = baseRest(function(array, values2) {
        return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true)) : [];
      });
      var differenceBy = baseRest(function(array, values2) {
        var iteratee2 = last(values2);
        if (isArrayLikeObject(iteratee2)) {
          iteratee2 = undefined2;
        }
        return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true), getIteratee(iteratee2, 2)) : [];
      });
      var differenceWith = baseRest(function(array, values2) {
        var comparator = last(values2);
        if (isArrayLikeObject(comparator)) {
          comparator = undefined2;
        }
        return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values2, 1, isArrayLikeObject, true), undefined2, comparator) : [];
      });
      function drop(array, n, guard) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        n = guard || n === undefined2 ? 1 : toInteger(n);
        return baseSlice(array, n < 0 ? 0 : n, length);
      }
      function dropRight(array, n, guard) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        n = guard || n === undefined2 ? 1 : toInteger(n);
        n = length - n;
        return baseSlice(array, 0, n < 0 ? 0 : n);
      }
      function dropRightWhile(array, predicate) {
        return array && array.length ? baseWhile(array, getIteratee(predicate, 3), true, true) : [];
      }
      function dropWhile(array, predicate) {
        return array && array.length ? baseWhile(array, getIteratee(predicate, 3), true) : [];
      }
      function fill(array, value, start, end) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        if (start && typeof start != "number" && isIterateeCall(array, value, start)) {
          start = 0;
          end = length;
        }
        return baseFill(array, value, start, end);
      }
      function findIndex(array, predicate, fromIndex) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return -1;
        }
        var index = fromIndex == null ? 0 : toInteger(fromIndex);
        if (index < 0) {
          index = nativeMax(length + index, 0);
        }
        return baseFindIndex(array, getIteratee(predicate, 3), index);
      }
      function findLastIndex(array, predicate, fromIndex) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return -1;
        }
        var index = length - 1;
        if (fromIndex !== undefined2) {
          index = toInteger(fromIndex);
          index = fromIndex < 0 ? nativeMax(length + index, 0) : nativeMin(index, length - 1);
        }
        return baseFindIndex(array, getIteratee(predicate, 3), index, true);
      }
      function flatten(array) {
        var length = array == null ? 0 : array.length;
        return length ? baseFlatten(array, 1) : [];
      }
      function flattenDeep(array) {
        var length = array == null ? 0 : array.length;
        return length ? baseFlatten(array, INFINITY) : [];
      }
      function flattenDepth(array, depth) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        depth = depth === undefined2 ? 1 : toInteger(depth);
        return baseFlatten(array, depth);
      }
      function fromPairs(pairs) {
        var index = -1, length = pairs == null ? 0 : pairs.length, result2 = {};
        while (++index < length) {
          var pair = pairs[index];
          result2[pair[0]] = pair[1];
        }
        return result2;
      }
      function head(array) {
        return array && array.length ? array[0] : undefined2;
      }
      function indexOf(array, value, fromIndex) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return -1;
        }
        var index = fromIndex == null ? 0 : toInteger(fromIndex);
        if (index < 0) {
          index = nativeMax(length + index, 0);
        }
        return baseIndexOf(array, value, index);
      }
      function initial(array) {
        var length = array == null ? 0 : array.length;
        return length ? baseSlice(array, 0, -1) : [];
      }
      var intersection = baseRest(function(arrays) {
        var mapped = arrayMap(arrays, castArrayLikeObject);
        return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped) : [];
      });
      var intersectionBy = baseRest(function(arrays) {
        var iteratee2 = last(arrays), mapped = arrayMap(arrays, castArrayLikeObject);
        if (iteratee2 === last(mapped)) {
          iteratee2 = undefined2;
        } else {
          mapped.pop();
        }
        return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped, getIteratee(iteratee2, 2)) : [];
      });
      var intersectionWith = baseRest(function(arrays) {
        var comparator = last(arrays), mapped = arrayMap(arrays, castArrayLikeObject);
        comparator = typeof comparator == "function" ? comparator : undefined2;
        if (comparator) {
          mapped.pop();
        }
        return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped, undefined2, comparator) : [];
      });
      function join(array, separator) {
        return array == null ? "" : nativeJoin.call(array, separator);
      }
      function last(array) {
        var length = array == null ? 0 : array.length;
        return length ? array[length - 1] : undefined2;
      }
      function lastIndexOf(array, value, fromIndex) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return -1;
        }
        var index = length;
        if (fromIndex !== undefined2) {
          index = toInteger(fromIndex);
          index = index < 0 ? nativeMax(length + index, 0) : nativeMin(index, length - 1);
        }
        return value === value ? strictLastIndexOf(array, value, index) : baseFindIndex(array, baseIsNaN, index, true);
      }
      function nth(array, n) {
        return array && array.length ? baseNth(array, toInteger(n)) : undefined2;
      }
      var pull = baseRest(pullAll);
      function pullAll(array, values2) {
        return array && array.length && values2 && values2.length ? basePullAll(array, values2) : array;
      }
      function pullAllBy(array, values2, iteratee2) {
        return array && array.length && values2 && values2.length ? basePullAll(array, values2, getIteratee(iteratee2, 2)) : array;
      }
      function pullAllWith(array, values2, comparator) {
        return array && array.length && values2 && values2.length ? basePullAll(array, values2, undefined2, comparator) : array;
      }
      var pullAt = flatRest(function(array, indexes) {
        var length = array == null ? 0 : array.length, result2 = baseAt(array, indexes);
        basePullAt(array, arrayMap(indexes, function(index) {
          return isIndex(index, length) ? +index : index;
        }).sort(compareAscending));
        return result2;
      });
      function remove(array, predicate) {
        var result2 = [];
        if (!(array && array.length)) {
          return result2;
        }
        var index = -1, indexes = [], length = array.length;
        predicate = getIteratee(predicate, 3);
        while (++index < length) {
          var value = array[index];
          if (predicate(value, index, array)) {
            result2.push(value);
            indexes.push(index);
          }
        }
        basePullAt(array, indexes);
        return result2;
      }
      function reverse(array) {
        return array == null ? array : nativeReverse.call(array);
      }
      function slice(array, start, end) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        if (end && typeof end != "number" && isIterateeCall(array, start, end)) {
          start = 0;
          end = length;
        } else {
          start = start == null ? 0 : toInteger(start);
          end = end === undefined2 ? length : toInteger(end);
        }
        return baseSlice(array, start, end);
      }
      function sortedIndex(array, value) {
        return baseSortedIndex(array, value);
      }
      function sortedIndexBy(array, value, iteratee2) {
        return baseSortedIndexBy(array, value, getIteratee(iteratee2, 2));
      }
      function sortedIndexOf(array, value) {
        var length = array == null ? 0 : array.length;
        if (length) {
          var index = baseSortedIndex(array, value);
          if (index < length && eq(array[index], value)) {
            return index;
          }
        }
        return -1;
      }
      function sortedLastIndex(array, value) {
        return baseSortedIndex(array, value, true);
      }
      function sortedLastIndexBy(array, value, iteratee2) {
        return baseSortedIndexBy(array, value, getIteratee(iteratee2, 2), true);
      }
      function sortedLastIndexOf(array, value) {
        var length = array == null ? 0 : array.length;
        if (length) {
          var index = baseSortedIndex(array, value, true) - 1;
          if (eq(array[index], value)) {
            return index;
          }
        }
        return -1;
      }
      function sortedUniq(array) {
        return array && array.length ? baseSortedUniq(array) : [];
      }
      function sortedUniqBy(array, iteratee2) {
        return array && array.length ? baseSortedUniq(array, getIteratee(iteratee2, 2)) : [];
      }
      function tail(array) {
        var length = array == null ? 0 : array.length;
        return length ? baseSlice(array, 1, length) : [];
      }
      function take(array, n, guard) {
        if (!(array && array.length)) {
          return [];
        }
        n = guard || n === undefined2 ? 1 : toInteger(n);
        return baseSlice(array, 0, n < 0 ? 0 : n);
      }
      function takeRight(array, n, guard) {
        var length = array == null ? 0 : array.length;
        if (!length) {
          return [];
        }
        n = guard || n === undefined2 ? 1 : toInteger(n);
        n = length - n;
        return baseSlice(array, n < 0 ? 0 : n, length);
      }
      function takeRightWhile(array, predicate) {
        return array && array.length ? baseWhile(array, getIteratee(predicate, 3), false, true) : [];
      }
      function takeWhile(array, predicate) {
        return array && array.length ? baseWhile(array, getIteratee(predicate, 3)) : [];
      }
      var union = baseRest(function(arrays) {
        return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true));
      });
      var unionBy = baseRest(function(arrays) {
        var iteratee2 = last(arrays);
        if (isArrayLikeObject(iteratee2)) {
          iteratee2 = undefined2;
        }
        return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), getIteratee(iteratee2, 2));
      });
      var unionWith = baseRest(function(arrays) {
        var comparator = last(arrays);
        comparator = typeof comparator == "function" ? comparator : undefined2;
        return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), undefined2, comparator);
      });
      function uniq(array) {
        return array && array.length ? baseUniq(array) : [];
      }
      function uniqBy(array, iteratee2) {
        return array && array.length ? baseUniq(array, getIteratee(iteratee2, 2)) : [];
      }
      function uniqWith(array, comparator) {
        comparator = typeof comparator == "function" ? comparator : undefined2;
        return array && array.length ? baseUniq(array, undefined2, comparator) : [];
      }
      function unzip(array) {
        if (!(array && array.length)) {
          return [];
        }
        var length = 0;
        array = arrayFilter(array, function(group) {
          if (isArrayLikeObject(group)) {
            length = nativeMax(group.length, length);
            return true;
          }
        });
        return baseTimes(length, function(index) {
          return arrayMap(array, baseProperty(index));
        });
      }
      function unzipWith(array, iteratee2) {
        if (!(array && array.length)) {
          return [];
        }
        var result2 = unzip(array);
        if (iteratee2 == null) {
          return result2;
        }
        return arrayMap(result2, function(group) {
          return apply(iteratee2, undefined2, group);
        });
      }
      var without = baseRest(function(array, values2) {
        return isArrayLikeObject(array) ? baseDifference(array, values2) : [];
      });
      var xor = baseRest(function(arrays) {
        return baseXor(arrayFilter(arrays, isArrayLikeObject));
      });
      var xorBy = baseRest(function(arrays) {
        var iteratee2 = last(arrays);
        if (isArrayLikeObject(iteratee2)) {
          iteratee2 = undefined2;
        }
        return baseXor(arrayFilter(arrays, isArrayLikeObject), getIteratee(iteratee2, 2));
      });
      var xorWith = baseRest(function(arrays) {
        var comparator = last(arrays);
        comparator = typeof comparator == "function" ? comparator : undefined2;
        return baseXor(arrayFilter(arrays, isArrayLikeObject), undefined2, comparator);
      });
      var zip = baseRest(unzip);
      function zipObject(props, values2) {
        return baseZipObject(props || [], values2 || [], assignValue);
      }
      function zipObjectDeep(props, values2) {
        return baseZipObject(props || [], values2 || [], baseSet);
      }
      var zipWith = baseRest(function(arrays) {
        var length = arrays.length, iteratee2 = length > 1 ? arrays[length - 1] : undefined2;
        iteratee2 = typeof iteratee2 == "function" ? (arrays.pop(), iteratee2) : undefined2;
        return unzipWith(arrays, iteratee2);
      });
      function chain(value) {
        var result2 = lodash(value);
        result2.__chain__ = true;
        return result2;
      }
      function tap(value, interceptor) {
        interceptor(value);
        return value;
      }
      function thru(value, interceptor) {
        return interceptor(value);
      }
      var wrapperAt = flatRest(function(paths) {
        var length = paths.length, start = length ? paths[0] : 0, value = this.__wrapped__, interceptor = function(object) {
          return baseAt(object, paths);
        };
        if (length > 1 || this.__actions__.length || !(value instanceof LazyWrapper) || !isIndex(start)) {
          return this.thru(interceptor);
        }
        value = value.slice(start, +start + (length ? 1 : 0));
        value.__actions__.push({
          func: thru,
          args: [interceptor],
          thisArg: undefined2
        });
        return new LodashWrapper(value, this.__chain__).thru(function(array) {
          if (length && !array.length) {
            array.push(undefined2);
          }
          return array;
        });
      });
      function wrapperChain() {
        return chain(this);
      }
      function wrapperCommit() {
        return new LodashWrapper(this.value(), this.__chain__);
      }
      function wrapperNext() {
        if (this.__values__ === undefined2) {
          this.__values__ = toArray(this.value());
        }
        var done = this.__index__ >= this.__values__.length, value = done ? undefined2 : this.__values__[this.__index__++];
        return { done, value };
      }
      function wrapperToIterator() {
        return this;
      }
      function wrapperPlant(value) {
        var result2, parent2 = this;
        while (parent2 instanceof baseLodash) {
          var clone2 = wrapperClone(parent2);
          clone2.__index__ = 0;
          clone2.__values__ = undefined2;
          if (result2) {
            previous.__wrapped__ = clone2;
          } else {
            result2 = clone2;
          }
          var previous = clone2;
          parent2 = parent2.__wrapped__;
        }
        previous.__wrapped__ = value;
        return result2;
      }
      function wrapperReverse() {
        var value = this.__wrapped__;
        if (value instanceof LazyWrapper) {
          var wrapped = value;
          if (this.__actions__.length) {
            wrapped = new LazyWrapper(this);
          }
          wrapped = wrapped.reverse();
          wrapped.__actions__.push({
            func: thru,
            args: [reverse],
            thisArg: undefined2
          });
          return new LodashWrapper(wrapped, this.__chain__);
        }
        return this.thru(reverse);
      }
      function wrapperValue() {
        return baseWrapperValue(this.__wrapped__, this.__actions__);
      }
      var countBy = createAggregator(function(result2, value, key) {
        if (hasOwnProperty.call(result2, key)) {
          ++result2[key];
        } else {
          baseAssignValue(result2, key, 1);
        }
      });
      function every(collection, predicate, guard) {
        var func = isArray(collection) ? arrayEvery : baseEvery;
        if (guard && isIterateeCall(collection, predicate, guard)) {
          predicate = undefined2;
        }
        return func(collection, getIteratee(predicate, 3));
      }
      function filter(collection, predicate) {
        var func = isArray(collection) ? arrayFilter : baseFilter;
        return func(collection, getIteratee(predicate, 3));
      }
      var find = createFind(findIndex);
      var findLast = createFind(findLastIndex);
      function flatMap(collection, iteratee2) {
        return baseFlatten(map(collection, iteratee2), 1);
      }
      function flatMapDeep(collection, iteratee2) {
        return baseFlatten(map(collection, iteratee2), INFINITY);
      }
      function flatMapDepth(collection, iteratee2, depth) {
        depth = depth === undefined2 ? 1 : toInteger(depth);
        return baseFlatten(map(collection, iteratee2), depth);
      }
      function forEach(collection, iteratee2) {
        var func = isArray(collection) ? arrayEach : baseEach;
        return func(collection, getIteratee(iteratee2, 3));
      }
      function forEachRight(collection, iteratee2) {
        var func = isArray(collection) ? arrayEachRight : baseEachRight;
        return func(collection, getIteratee(iteratee2, 3));
      }
      var groupBy = createAggregator(function(result2, value, key) {
        if (hasOwnProperty.call(result2, key)) {
          result2[key].push(value);
        } else {
          baseAssignValue(result2, key, [value]);
        }
      });
      function includes(collection, value, fromIndex, guard) {
        collection = isArrayLike(collection) ? collection : values(collection);
        fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
        var length = collection.length;
        if (fromIndex < 0) {
          fromIndex = nativeMax(length + fromIndex, 0);
        }
        return isString(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && baseIndexOf(collection, value, fromIndex) > -1;
      }
      var invokeMap = baseRest(function(collection, path, args) {
        var index = -1, isFunc = typeof path == "function", result2 = isArrayLike(collection) ? Array2(collection.length) : [];
        baseEach(collection, function(value) {
          result2[++index] = isFunc ? apply(path, value, args) : baseInvoke(value, path, args);
        });
        return result2;
      });
      var keyBy = createAggregator(function(result2, value, key) {
        baseAssignValue(result2, key, value);
      });
      function map(collection, iteratee2) {
        var func = isArray(collection) ? arrayMap : baseMap;
        return func(collection, getIteratee(iteratee2, 3));
      }
      function orderBy(collection, iteratees, orders, guard) {
        if (collection == null) {
          return [];
        }
        if (!isArray(iteratees)) {
          iteratees = iteratees == null ? [] : [iteratees];
        }
        orders = guard ? undefined2 : orders;
        if (!isArray(orders)) {
          orders = orders == null ? [] : [orders];
        }
        return baseOrderBy(collection, iteratees, orders);
      }
      var partition = createAggregator(function(result2, value, key) {
        result2[key ? 0 : 1].push(value);
      }, function() {
        return [[], []];
      });
      function reduce(collection, iteratee2, accumulator) {
        var func = isArray(collection) ? arrayReduce : baseReduce, initAccum = arguments.length < 3;
        return func(collection, getIteratee(iteratee2, 4), accumulator, initAccum, baseEach);
      }
      function reduceRight(collection, iteratee2, accumulator) {
        var func = isArray(collection) ? arrayReduceRight : baseReduce, initAccum = arguments.length < 3;
        return func(collection, getIteratee(iteratee2, 4), accumulator, initAccum, baseEachRight);
      }
      function reject(collection, predicate) {
        var func = isArray(collection) ? arrayFilter : baseFilter;
        return func(collection, negate(getIteratee(predicate, 3)));
      }
      function sample(collection) {
        var func = isArray(collection) ? arraySample : baseSample;
        return func(collection);
      }
      function sampleSize(collection, n, guard) {
        if (guard ? isIterateeCall(collection, n, guard) : n === undefined2) {
          n = 1;
        } else {
          n = toInteger(n);
        }
        var func = isArray(collection) ? arraySampleSize : baseSampleSize;
        return func(collection, n);
      }
      function shuffle(collection) {
        var func = isArray(collection) ? arrayShuffle : baseShuffle;
        return func(collection);
      }
      function size(collection) {
        if (collection == null) {
          return 0;
        }
        if (isArrayLike(collection)) {
          return isString(collection) ? stringSize(collection) : collection.length;
        }
        var tag = getTag(collection);
        if (tag == mapTag || tag == setTag) {
          return collection.size;
        }
        return baseKeys(collection).length;
      }
      function some(collection, predicate, guard) {
        var func = isArray(collection) ? arraySome : baseSome;
        if (guard && isIterateeCall(collection, predicate, guard)) {
          predicate = undefined2;
        }
        return func(collection, getIteratee(predicate, 3));
      }
      var sortBy = baseRest(function(collection, iteratees) {
        if (collection == null) {
          return [];
        }
        var length = iteratees.length;
        if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
          iteratees = [];
        } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
          iteratees = [iteratees[0]];
        }
        return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
      });
      var now = ctxNow || function() {
        return root.Date.now();
      };
      function after(n, func) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        n = toInteger(n);
        return function() {
          if (--n < 1) {
            return func.apply(this, arguments);
          }
        };
      }
      function ary(func, n, guard) {
        n = guard ? undefined2 : n;
        n = func && n == null ? func.length : n;
        return createWrap(func, WRAP_ARY_FLAG, undefined2, undefined2, undefined2, undefined2, n);
      }
      function before(n, func) {
        var result2;
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        n = toInteger(n);
        return function() {
          if (--n > 0) {
            result2 = func.apply(this, arguments);
          }
          if (n <= 1) {
            func = undefined2;
          }
          return result2;
        };
      }
      var bind = baseRest(function(func, thisArg, partials) {
        var bitmask = WRAP_BIND_FLAG;
        if (partials.length) {
          var holders = replaceHolders(partials, getHolder(bind));
          bitmask |= WRAP_PARTIAL_FLAG;
        }
        return createWrap(func, bitmask, thisArg, partials, holders);
      });
      var bindKey = baseRest(function(object, key, partials) {
        var bitmask = WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG;
        if (partials.length) {
          var holders = replaceHolders(partials, getHolder(bindKey));
          bitmask |= WRAP_PARTIAL_FLAG;
        }
        return createWrap(key, bitmask, object, partials, holders);
      });
      function curry(func, arity, guard) {
        arity = guard ? undefined2 : arity;
        var result2 = createWrap(func, WRAP_CURRY_FLAG, undefined2, undefined2, undefined2, undefined2, undefined2, arity);
        result2.placeholder = curry.placeholder;
        return result2;
      }
      function curryRight(func, arity, guard) {
        arity = guard ? undefined2 : arity;
        var result2 = createWrap(func, WRAP_CURRY_RIGHT_FLAG, undefined2, undefined2, undefined2, undefined2, undefined2, arity);
        result2.placeholder = curryRight.placeholder;
        return result2;
      }
      function debounce(func, wait, options) {
        var lastArgs, lastThis, maxWait, result2, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        wait = toNumber(wait) || 0;
        if (isObject(options)) {
          leading = !!options.leading;
          maxing = "maxWait" in options;
          maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
          trailing = "trailing" in options ? !!options.trailing : trailing;
        }
        function invokeFunc(time) {
          var args = lastArgs, thisArg = lastThis;
          lastArgs = lastThis = undefined2;
          lastInvokeTime = time;
          result2 = func.apply(thisArg, args);
          return result2;
        }
        function leadingEdge(time) {
          lastInvokeTime = time;
          timerId = setTimeout2(timerExpired, wait);
          return leading ? invokeFunc(time) : result2;
        }
        function remainingWait(time) {
          var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
          return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
        }
        function shouldInvoke(time) {
          var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
          return lastCallTime === undefined2 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
        }
        function timerExpired() {
          var time = now();
          if (shouldInvoke(time)) {
            return trailingEdge(time);
          }
          timerId = setTimeout2(timerExpired, remainingWait(time));
        }
        function trailingEdge(time) {
          timerId = undefined2;
          if (trailing && lastArgs) {
            return invokeFunc(time);
          }
          lastArgs = lastThis = undefined2;
          return result2;
        }
        function cancel() {
          if (timerId !== undefined2) {
            clearTimeout2(timerId);
          }
          lastInvokeTime = 0;
          lastArgs = lastCallTime = lastThis = timerId = undefined2;
        }
        function flush() {
          return timerId === undefined2 ? result2 : trailingEdge(now());
        }
        function debounced() {
          var time = now(), isInvoking = shouldInvoke(time);
          lastArgs = arguments;
          lastThis = this;
          lastCallTime = time;
          if (isInvoking) {
            if (timerId === undefined2) {
              return leadingEdge(lastCallTime);
            }
            if (maxing) {
              clearTimeout2(timerId);
              timerId = setTimeout2(timerExpired, wait);
              return invokeFunc(lastCallTime);
            }
          }
          if (timerId === undefined2) {
            timerId = setTimeout2(timerExpired, wait);
          }
          return result2;
        }
        debounced.cancel = cancel;
        debounced.flush = flush;
        return debounced;
      }
      var defer = baseRest(function(func, args) {
        return baseDelay(func, 1, args);
      });
      var delay = baseRest(function(func, wait, args) {
        return baseDelay(func, toNumber(wait) || 0, args);
      });
      function flip(func) {
        return createWrap(func, WRAP_FLIP_FLAG);
      }
      function memoize(func, resolver) {
        if (typeof func != "function" || resolver != null && typeof resolver != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        var memoized = function() {
          var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
          if (cache.has(key)) {
            return cache.get(key);
          }
          var result2 = func.apply(this, args);
          memoized.cache = cache.set(key, result2) || cache;
          return result2;
        };
        memoized.cache = new (memoize.Cache || MapCache);
        return memoized;
      }
      memoize.Cache = MapCache;
      function negate(predicate) {
        if (typeof predicate != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        return function() {
          var args = arguments;
          switch (args.length) {
            case 0:
              return !predicate.call(this);
            case 1:
              return !predicate.call(this, args[0]);
            case 2:
              return !predicate.call(this, args[0], args[1]);
            case 3:
              return !predicate.call(this, args[0], args[1], args[2]);
          }
          return !predicate.apply(this, args);
        };
      }
      function once(func) {
        return before(2, func);
      }
      var overArgs = castRest(function(func, transforms) {
        transforms = transforms.length == 1 && isArray(transforms[0]) ? arrayMap(transforms[0], baseUnary(getIteratee())) : arrayMap(baseFlatten(transforms, 1), baseUnary(getIteratee()));
        var funcsLength = transforms.length;
        return baseRest(function(args) {
          var index = -1, length = nativeMin(args.length, funcsLength);
          while (++index < length) {
            args[index] = transforms[index].call(this, args[index]);
          }
          return apply(func, this, args);
        });
      });
      var partial = baseRest(function(func, partials) {
        var holders = replaceHolders(partials, getHolder(partial));
        return createWrap(func, WRAP_PARTIAL_FLAG, undefined2, partials, holders);
      });
      var partialRight = baseRest(function(func, partials) {
        var holders = replaceHolders(partials, getHolder(partialRight));
        return createWrap(func, WRAP_PARTIAL_RIGHT_FLAG, undefined2, partials, holders);
      });
      var rearg = flatRest(function(func, indexes) {
        return createWrap(func, WRAP_REARG_FLAG, undefined2, undefined2, undefined2, indexes);
      });
      function rest(func, start) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        start = start === undefined2 ? start : toInteger(start);
        return baseRest(func, start);
      }
      function spread(func, start) {
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        start = start == null ? 0 : nativeMax(toInteger(start), 0);
        return baseRest(function(args) {
          var array = args[start], otherArgs = castSlice(args, 0, start);
          if (array) {
            arrayPush(otherArgs, array);
          }
          return apply(func, this, otherArgs);
        });
      }
      function throttle(func, wait, options) {
        var leading = true, trailing = true;
        if (typeof func != "function") {
          throw new TypeError2(FUNC_ERROR_TEXT);
        }
        if (isObject(options)) {
          leading = "leading" in options ? !!options.leading : leading;
          trailing = "trailing" in options ? !!options.trailing : trailing;
        }
        return debounce(func, wait, {
          leading,
          maxWait: wait,
          trailing
        });
      }
      function unary(func) {
        return ary(func, 1);
      }
      function wrap(value, wrapper) {
        return partial(castFunction(wrapper), value);
      }
      function castArray() {
        if (!arguments.length) {
          return [];
        }
        var value = arguments[0];
        return isArray(value) ? value : [value];
      }
      function clone(value) {
        return baseClone(value, CLONE_SYMBOLS_FLAG);
      }
      function cloneWith(value, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined2;
        return baseClone(value, CLONE_SYMBOLS_FLAG, customizer);
      }
      function cloneDeep(value) {
        return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
      }
      function cloneDeepWith(value, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined2;
        return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG, customizer);
      }
      function conformsTo(object, source) {
        return source == null || baseConformsTo(object, source, keys(source));
      }
      function eq(value, other) {
        return value === other || value !== value && other !== other;
      }
      var gt = createRelationalOperation(baseGt);
      var gte = createRelationalOperation(function(value, other) {
        return value >= other;
      });
      var isArguments = baseIsArguments(function() {
        return arguments;
      }()) ? baseIsArguments : function(value) {
        return isObjectLike(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
      };
      var isArray = Array2.isArray;
      var isArrayBuffer = nodeIsArrayBuffer ? baseUnary(nodeIsArrayBuffer) : baseIsArrayBuffer;
      function isArrayLike(value) {
        return value != null && isLength(value.length) && !isFunction(value);
      }
      function isArrayLikeObject(value) {
        return isObjectLike(value) && isArrayLike(value);
      }
      function isBoolean(value) {
        return value === true || value === false || isObjectLike(value) && baseGetTag(value) == boolTag;
      }
      var isBuffer = nativeIsBuffer || stubFalse;
      var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;
      function isElement(value) {
        return isObjectLike(value) && value.nodeType === 1 && !isPlainObject(value);
      }
      function isEmpty(value) {
        if (value == null) {
          return true;
        }
        if (isArrayLike(value) && (isArray(value) || typeof value == "string" || typeof value.splice == "function" || isBuffer(value) || isTypedArray(value) || isArguments(value))) {
          return !value.length;
        }
        var tag = getTag(value);
        if (tag == mapTag || tag == setTag) {
          return !value.size;
        }
        if (isPrototype(value)) {
          return !baseKeys(value).length;
        }
        for (var key in value) {
          if (hasOwnProperty.call(value, key)) {
            return false;
          }
        }
        return true;
      }
      function isEqual(value, other) {
        return baseIsEqual(value, other);
      }
      function isEqualWith(value, other, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined2;
        var result2 = customizer ? customizer(value, other) : undefined2;
        return result2 === undefined2 ? baseIsEqual(value, other, undefined2, customizer) : !!result2;
      }
      function isError(value) {
        if (!isObjectLike(value)) {
          return false;
        }
        var tag = baseGetTag(value);
        return tag == errorTag || tag == domExcTag || typeof value.message == "string" && typeof value.name == "string" && !isPlainObject(value);
      }
      function isFinite(value) {
        return typeof value == "number" && nativeIsFinite(value);
      }
      function isFunction(value) {
        if (!isObject(value)) {
          return false;
        }
        var tag = baseGetTag(value);
        return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
      }
      function isInteger(value) {
        return typeof value == "number" && value == toInteger(value);
      }
      function isLength(value) {
        return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
      }
      function isObject(value) {
        var type = typeof value;
        return value != null && (type == "object" || type == "function");
      }
      function isObjectLike(value) {
        return value != null && typeof value == "object";
      }
      var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;
      function isMatch(object, source) {
        return object === source || baseIsMatch(object, source, getMatchData(source));
      }
      function isMatchWith(object, source, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined2;
        return baseIsMatch(object, source, getMatchData(source), customizer);
      }
      function isNaN(value) {
        return isNumber(value) && value != +value;
      }
      function isNative(value) {
        if (isMaskable(value)) {
          throw new Error2(CORE_ERROR_TEXT);
        }
        return baseIsNative(value);
      }
      function isNull(value) {
        return value === null;
      }
      function isNil(value) {
        return value == null;
      }
      function isNumber(value) {
        return typeof value == "number" || isObjectLike(value) && baseGetTag(value) == numberTag;
      }
      function isPlainObject(value) {
        if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
          return false;
        }
        var proto = getPrototype(value);
        if (proto === null) {
          return true;
        }
        var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
        return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
      }
      var isRegExp = nodeIsRegExp ? baseUnary(nodeIsRegExp) : baseIsRegExp;
      function isSafeInteger(value) {
        return isInteger(value) && value >= -MAX_SAFE_INTEGER && value <= MAX_SAFE_INTEGER;
      }
      var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;
      function isString(value) {
        return typeof value == "string" || !isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag;
      }
      function isSymbol(value) {
        return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
      }
      var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
      function isUndefined(value) {
        return value === undefined2;
      }
      function isWeakMap(value) {
        return isObjectLike(value) && getTag(value) == weakMapTag;
      }
      function isWeakSet(value) {
        return isObjectLike(value) && baseGetTag(value) == weakSetTag;
      }
      var lt = createRelationalOperation(baseLt);
      var lte = createRelationalOperation(function(value, other) {
        return value <= other;
      });
      function toArray(value) {
        if (!value) {
          return [];
        }
        if (isArrayLike(value)) {
          return isString(value) ? stringToArray(value) : copyArray(value);
        }
        if (symIterator && value[symIterator]) {
          return iteratorToArray(value[symIterator]());
        }
        var tag = getTag(value), func = tag == mapTag ? mapToArray : tag == setTag ? setToArray : values;
        return func(value);
      }
      function toFinite(value) {
        if (!value) {
          return value === 0 ? value : 0;
        }
        value = toNumber(value);
        if (value === INFINITY || value === -INFINITY) {
          var sign = value < 0 ? -1 : 1;
          return sign * MAX_INTEGER;
        }
        return value === value ? value : 0;
      }
      function toInteger(value) {
        var result2 = toFinite(value), remainder = result2 % 1;
        return result2 === result2 ? remainder ? result2 - remainder : result2 : 0;
      }
      function toLength(value) {
        return value ? baseClamp(toInteger(value), 0, MAX_ARRAY_LENGTH) : 0;
      }
      function toNumber(value) {
        if (typeof value == "number") {
          return value;
        }
        if (isSymbol(value)) {
          return NAN;
        }
        if (isObject(value)) {
          var other = typeof value.valueOf == "function" ? value.valueOf() : value;
          value = isObject(other) ? other + "" : other;
        }
        if (typeof value != "string") {
          return value === 0 ? value : +value;
        }
        value = baseTrim(value);
        var isBinary = reIsBinary.test(value);
        return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
      }
      function toPlainObject(value) {
        return copyObject(value, keysIn(value));
      }
      function toSafeInteger(value) {
        return value ? baseClamp(toInteger(value), -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER) : value === 0 ? value : 0;
      }
      function toString(value) {
        return value == null ? "" : baseToString(value);
      }
      var assign = createAssigner(function(object, source) {
        if (isPrototype(source) || isArrayLike(source)) {
          copyObject(source, keys(source), object);
          return;
        }
        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            assignValue(object, key, source[key]);
          }
        }
      });
      var assignIn = createAssigner(function(object, source) {
        copyObject(source, keysIn(source), object);
      });
      var assignInWith = createAssigner(function(object, source, srcIndex, customizer) {
        copyObject(source, keysIn(source), object, customizer);
      });
      var assignWith = createAssigner(function(object, source, srcIndex, customizer) {
        copyObject(source, keys(source), object, customizer);
      });
      var at = flatRest(baseAt);
      function create(prototype, properties) {
        var result2 = baseCreate(prototype);
        return properties == null ? result2 : baseAssign(result2, properties);
      }
      var defaults = baseRest(function(object, sources) {
        object = Object2(object);
        var index = -1;
        var length = sources.length;
        var guard = length > 2 ? sources[2] : undefined2;
        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          length = 1;
        }
        while (++index < length) {
          var source = sources[index];
          var props = keysIn(source);
          var propsIndex = -1;
          var propsLength = props.length;
          while (++propsIndex < propsLength) {
            var key = props[propsIndex];
            var value = object[key];
            if (value === undefined2 || eq(value, objectProto[key]) && !hasOwnProperty.call(object, key)) {
              object[key] = source[key];
            }
          }
        }
        return object;
      });
      var defaultsDeep = baseRest(function(args) {
        args.push(undefined2, customDefaultsMerge);
        return apply(mergeWith, undefined2, args);
      });
      function findKey(object, predicate) {
        return baseFindKey(object, getIteratee(predicate, 3), baseForOwn);
      }
      function findLastKey(object, predicate) {
        return baseFindKey(object, getIteratee(predicate, 3), baseForOwnRight);
      }
      function forIn(object, iteratee2) {
        return object == null ? object : baseFor(object, getIteratee(iteratee2, 3), keysIn);
      }
      function forInRight(object, iteratee2) {
        return object == null ? object : baseForRight(object, getIteratee(iteratee2, 3), keysIn);
      }
      function forOwn(object, iteratee2) {
        return object && baseForOwn(object, getIteratee(iteratee2, 3));
      }
      function forOwnRight(object, iteratee2) {
        return object && baseForOwnRight(object, getIteratee(iteratee2, 3));
      }
      function functions(object) {
        return object == null ? [] : baseFunctions(object, keys(object));
      }
      function functionsIn(object) {
        return object == null ? [] : baseFunctions(object, keysIn(object));
      }
      function get(object, path, defaultValue) {
        var result2 = object == null ? undefined2 : baseGet(object, path);
        return result2 === undefined2 ? defaultValue : result2;
      }
      function has(object, path) {
        return object != null && hasPath(object, path, baseHas);
      }
      function hasIn(object, path) {
        return object != null && hasPath(object, path, baseHasIn);
      }
      var invert = createInverter(function(result2, value, key) {
        if (value != null && typeof value.toString != "function") {
          value = nativeObjectToString.call(value);
        }
        result2[value] = key;
      }, constant(identity));
      var invertBy = createInverter(function(result2, value, key) {
        if (value != null && typeof value.toString != "function") {
          value = nativeObjectToString.call(value);
        }
        if (hasOwnProperty.call(result2, value)) {
          result2[value].push(key);
        } else {
          result2[value] = [key];
        }
      }, getIteratee);
      var invoke = baseRest(baseInvoke);
      function keys(object) {
        return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
      }
      function keysIn(object) {
        return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
      }
      function mapKeys(object, iteratee2) {
        var result2 = {};
        iteratee2 = getIteratee(iteratee2, 3);
        baseForOwn(object, function(value, key, object2) {
          baseAssignValue(result2, iteratee2(value, key, object2), value);
        });
        return result2;
      }
      function mapValues(object, iteratee2) {
        var result2 = {};
        iteratee2 = getIteratee(iteratee2, 3);
        baseForOwn(object, function(value, key, object2) {
          baseAssignValue(result2, key, iteratee2(value, key, object2));
        });
        return result2;
      }
      var merge = createAssigner(function(object, source, srcIndex) {
        baseMerge(object, source, srcIndex);
      });
      var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
        baseMerge(object, source, srcIndex, customizer);
      });
      var omit = flatRest(function(object, paths) {
        var result2 = {};
        if (object == null) {
          return result2;
        }
        var isDeep = false;
        paths = arrayMap(paths, function(path) {
          path = castPath(path, object);
          isDeep || (isDeep = path.length > 1);
          return path;
        });
        copyObject(object, getAllKeysIn(object), result2);
        if (isDeep) {
          result2 = baseClone(result2, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG, customOmitClone);
        }
        var length = paths.length;
        while (length--) {
          baseUnset(result2, paths[length]);
        }
        return result2;
      });
      function omitBy(object, predicate) {
        return pickBy(object, negate(getIteratee(predicate)));
      }
      var pick = flatRest(function(object, paths) {
        return object == null ? {} : basePick(object, paths);
      });
      function pickBy(object, predicate) {
        if (object == null) {
          return {};
        }
        var props = arrayMap(getAllKeysIn(object), function(prop) {
          return [prop];
        });
        predicate = getIteratee(predicate);
        return basePickBy(object, props, function(value, path) {
          return predicate(value, path[0]);
        });
      }
      function result(object, path, defaultValue) {
        path = castPath(path, object);
        var index = -1, length = path.length;
        if (!length) {
          length = 1;
          object = undefined2;
        }
        while (++index < length) {
          var value = object == null ? undefined2 : object[toKey(path[index])];
          if (value === undefined2) {
            index = length;
            value = defaultValue;
          }
          object = isFunction(value) ? value.call(object) : value;
        }
        return object;
      }
      function set(object, path, value) {
        return object == null ? object : baseSet(object, path, value);
      }
      function setWith(object, path, value, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined2;
        return object == null ? object : baseSet(object, path, value, customizer);
      }
      var toPairs = createToPairs(keys);
      var toPairsIn = createToPairs(keysIn);
      function transform(object, iteratee2, accumulator) {
        var isArr = isArray(object), isArrLike = isArr || isBuffer(object) || isTypedArray(object);
        iteratee2 = getIteratee(iteratee2, 4);
        if (accumulator == null) {
          var Ctor = object && object.constructor;
          if (isArrLike) {
            accumulator = isArr ? new Ctor : [];
          } else if (isObject(object)) {
            accumulator = isFunction(Ctor) ? baseCreate(getPrototype(object)) : {};
          } else {
            accumulator = {};
          }
        }
        (isArrLike ? arrayEach : baseForOwn)(object, function(value, index, object2) {
          return iteratee2(accumulator, value, index, object2);
        });
        return accumulator;
      }
      function unset(object, path) {
        return object == null ? true : baseUnset(object, path);
      }
      function update(object, path, updater) {
        return object == null ? object : baseUpdate(object, path, castFunction(updater));
      }
      function updateWith(object, path, updater, customizer) {
        customizer = typeof customizer == "function" ? customizer : undefined2;
        return object == null ? object : baseUpdate(object, path, castFunction(updater), customizer);
      }
      function values(object) {
        return object == null ? [] : baseValues(object, keys(object));
      }
      function valuesIn(object) {
        return object == null ? [] : baseValues(object, keysIn(object));
      }
      function clamp(number, lower, upper) {
        if (upper === undefined2) {
          upper = lower;
          lower = undefined2;
        }
        if (upper !== undefined2) {
          upper = toNumber(upper);
          upper = upper === upper ? upper : 0;
        }
        if (lower !== undefined2) {
          lower = toNumber(lower);
          lower = lower === lower ? lower : 0;
        }
        return baseClamp(toNumber(number), lower, upper);
      }
      function inRange(number, start, end) {
        start = toFinite(start);
        if (end === undefined2) {
          end = start;
          start = 0;
        } else {
          end = toFinite(end);
        }
        number = toNumber(number);
        return baseInRange(number, start, end);
      }
      function random(lower, upper, floating) {
        if (floating && typeof floating != "boolean" && isIterateeCall(lower, upper, floating)) {
          upper = floating = undefined2;
        }
        if (floating === undefined2) {
          if (typeof upper == "boolean") {
            floating = upper;
            upper = undefined2;
          } else if (typeof lower == "boolean") {
            floating = lower;
            lower = undefined2;
          }
        }
        if (lower === undefined2 && upper === undefined2) {
          lower = 0;
          upper = 1;
        } else {
          lower = toFinite(lower);
          if (upper === undefined2) {
            upper = lower;
            lower = 0;
          } else {
            upper = toFinite(upper);
          }
        }
        if (lower > upper) {
          var temp = lower;
          lower = upper;
          upper = temp;
        }
        if (floating || lower % 1 || upper % 1) {
          var rand = nativeRandom();
          return nativeMin(lower + rand * (upper - lower + freeParseFloat("1e-" + ((rand + "").length - 1))), upper);
        }
        return baseRandom(lower, upper);
      }
      var camelCase = createCompounder(function(result2, word, index) {
        word = word.toLowerCase();
        return result2 + (index ? capitalize(word) : word);
      });
      function capitalize(string) {
        return upperFirst(toString(string).toLowerCase());
      }
      function deburr(string) {
        string = toString(string);
        return string && string.replace(reLatin, deburrLetter).replace(reComboMark, "");
      }
      function endsWith(string, target, position) {
        string = toString(string);
        target = baseToString(target);
        var length = string.length;
        position = position === undefined2 ? length : baseClamp(toInteger(position), 0, length);
        var end = position;
        position -= target.length;
        return position >= 0 && string.slice(position, end) == target;
      }
      function escape2(string) {
        string = toString(string);
        return string && reHasUnescapedHtml.test(string) ? string.replace(reUnescapedHtml, escapeHtmlChar) : string;
      }
      function escapeRegExp(string) {
        string = toString(string);
        return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, "\\$&") : string;
      }
      var kebabCase = createCompounder(function(result2, word, index) {
        return result2 + (index ? "-" : "") + word.toLowerCase();
      });
      var lowerCase = createCompounder(function(result2, word, index) {
        return result2 + (index ? " " : "") + word.toLowerCase();
      });
      var lowerFirst = createCaseFirst("toLowerCase");
      function pad(string, length, chars) {
        string = toString(string);
        length = toInteger(length);
        var strLength = length ? stringSize(string) : 0;
        if (!length || strLength >= length) {
          return string;
        }
        var mid = (length - strLength) / 2;
        return createPadding(nativeFloor(mid), chars) + string + createPadding(nativeCeil(mid), chars);
      }
      function padEnd(string, length, chars) {
        string = toString(string);
        length = toInteger(length);
        var strLength = length ? stringSize(string) : 0;
        return length && strLength < length ? string + createPadding(length - strLength, chars) : string;
      }
      function padStart(string, length, chars) {
        string = toString(string);
        length = toInteger(length);
        var strLength = length ? stringSize(string) : 0;
        return length && strLength < length ? createPadding(length - strLength, chars) + string : string;
      }
      function parseInt2(string, radix, guard) {
        if (guard || radix == null) {
          radix = 0;
        } else if (radix) {
          radix = +radix;
        }
        return nativeParseInt(toString(string).replace(reTrimStart, ""), radix || 0);
      }
      function repeat(string, n, guard) {
        if (guard ? isIterateeCall(string, n, guard) : n === undefined2) {
          n = 1;
        } else {
          n = toInteger(n);
        }
        return baseRepeat(toString(string), n);
      }
      function replace() {
        var args = arguments, string = toString(args[0]);
        return args.length < 3 ? string : string.replace(args[1], args[2]);
      }
      var snakeCase = createCompounder(function(result2, word, index) {
        return result2 + (index ? "_" : "") + word.toLowerCase();
      });
      function split(string, separator, limit) {
        if (limit && typeof limit != "number" && isIterateeCall(string, separator, limit)) {
          separator = limit = undefined2;
        }
        limit = limit === undefined2 ? MAX_ARRAY_LENGTH : limit >>> 0;
        if (!limit) {
          return [];
        }
        string = toString(string);
        if (string && (typeof separator == "string" || separator != null && !isRegExp(separator))) {
          separator = baseToString(separator);
          if (!separator && hasUnicode(string)) {
            return castSlice(stringToArray(string), 0, limit);
          }
        }
        return string.split(separator, limit);
      }
      var startCase = createCompounder(function(result2, word, index) {
        return result2 + (index ? " " : "") + upperFirst(word);
      });
      function startsWith(string, target, position) {
        string = toString(string);
        position = position == null ? 0 : baseClamp(toInteger(position), 0, string.length);
        target = baseToString(target);
        return string.slice(position, position + target.length) == target;
      }
      function template(string, options, guard) {
        var settings = lodash.templateSettings;
        if (guard && isIterateeCall(string, options, guard)) {
          options = undefined2;
        }
        string = toString(string);
        options = assignInWith({}, options, settings, customDefaultsAssignIn);
        var imports = assignInWith({}, options.imports, settings.imports, customDefaultsAssignIn), importsKeys = keys(imports), importsValues = baseValues(imports, importsKeys);
        var isEscaping, isEvaluating, index = 0, interpolate = options.interpolate || reNoMatch, source = "__p += '";
        var reDelimiters = RegExp2((options.escape || reNoMatch).source + "|" + interpolate.source + "|" + (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + "|" + (options.evaluate || reNoMatch).source + "|$", "g");
        var sourceURL = "//# sourceURL=" + (hasOwnProperty.call(options, "sourceURL") ? (options.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++templateCounter + "]") + `
`;
        string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
          interpolateValue || (interpolateValue = esTemplateValue);
          source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);
          if (escapeValue) {
            isEscaping = true;
            source += `' +
__e(` + escapeValue + `) +
'`;
          }
          if (evaluateValue) {
            isEvaluating = true;
            source += `';
` + evaluateValue + `;
__p += '`;
          }
          if (interpolateValue) {
            source += `' +
((__t = (` + interpolateValue + `)) == null ? '' : __t) +
'`;
          }
          index = offset + match.length;
          return match;
        });
        source += `';
`;
        var variable = hasOwnProperty.call(options, "variable") && options.variable;
        if (!variable) {
          source = `with (obj) {
` + source + `
}
`;
        } else if (reForbiddenIdentifierChars.test(variable)) {
          throw new Error2(INVALID_TEMPL_VAR_ERROR_TEXT);
        }
        source = (isEvaluating ? source.replace(reEmptyStringLeading, "") : source).replace(reEmptyStringMiddle, "$1").replace(reEmptyStringTrailing, "$1;");
        source = "function(" + (variable || "obj") + `) {
` + (variable ? "" : `obj || (obj = {});
`) + "var __t, __p = ''" + (isEscaping ? ", __e = _.escape" : "") + (isEvaluating ? `, __j = Array.prototype.join;
` + `function print() { __p += __j.call(arguments, '') }
` : `;
`) + source + `return __p
}`;
        var result2 = attempt(function() {
          return Function2(importsKeys, sourceURL + "return " + source).apply(undefined2, importsValues);
        });
        result2.source = source;
        if (isError(result2)) {
          throw result2;
        }
        return result2;
      }
      function toLower(value) {
        return toString(value).toLowerCase();
      }
      function toUpper(value) {
        return toString(value).toUpperCase();
      }
      function trim(string, chars, guard) {
        string = toString(string);
        if (string && (guard || chars === undefined2)) {
          return baseTrim(string);
        }
        if (!string || !(chars = baseToString(chars))) {
          return string;
        }
        var strSymbols = stringToArray(string), chrSymbols = stringToArray(chars), start = charsStartIndex(strSymbols, chrSymbols), end = charsEndIndex(strSymbols, chrSymbols) + 1;
        return castSlice(strSymbols, start, end).join("");
      }
      function trimEnd(string, chars, guard) {
        string = toString(string);
        if (string && (guard || chars === undefined2)) {
          return string.slice(0, trimmedEndIndex(string) + 1);
        }
        if (!string || !(chars = baseToString(chars))) {
          return string;
        }
        var strSymbols = stringToArray(string), end = charsEndIndex(strSymbols, stringToArray(chars)) + 1;
        return castSlice(strSymbols, 0, end).join("");
      }
      function trimStart(string, chars, guard) {
        string = toString(string);
        if (string && (guard || chars === undefined2)) {
          return string.replace(reTrimStart, "");
        }
        if (!string || !(chars = baseToString(chars))) {
          return string;
        }
        var strSymbols = stringToArray(string), start = charsStartIndex(strSymbols, stringToArray(chars));
        return castSlice(strSymbols, start).join("");
      }
      function truncate(string, options) {
        var length = DEFAULT_TRUNC_LENGTH, omission = DEFAULT_TRUNC_OMISSION;
        if (isObject(options)) {
          var separator = "separator" in options ? options.separator : separator;
          length = "length" in options ? toInteger(options.length) : length;
          omission = "omission" in options ? baseToString(options.omission) : omission;
        }
        string = toString(string);
        var strLength = string.length;
        if (hasUnicode(string)) {
          var strSymbols = stringToArray(string);
          strLength = strSymbols.length;
        }
        if (length >= strLength) {
          return string;
        }
        var end = length - stringSize(omission);
        if (end < 1) {
          return omission;
        }
        var result2 = strSymbols ? castSlice(strSymbols, 0, end).join("") : string.slice(0, end);
        if (separator === undefined2) {
          return result2 + omission;
        }
        if (strSymbols) {
          end += result2.length - end;
        }
        if (isRegExp(separator)) {
          if (string.slice(end).search(separator)) {
            var match, substring = result2;
            if (!separator.global) {
              separator = RegExp2(separator.source, toString(reFlags.exec(separator)) + "g");
            }
            separator.lastIndex = 0;
            while (match = separator.exec(substring)) {
              var newEnd = match.index;
            }
            result2 = result2.slice(0, newEnd === undefined2 ? end : newEnd);
          }
        } else if (string.indexOf(baseToString(separator), end) != end) {
          var index = result2.lastIndexOf(separator);
          if (index > -1) {
            result2 = result2.slice(0, index);
          }
        }
        return result2 + omission;
      }
      function unescape2(string) {
        string = toString(string);
        return string && reHasEscapedHtml.test(string) ? string.replace(reEscapedHtml, unescapeHtmlChar) : string;
      }
      var upperCase = createCompounder(function(result2, word, index) {
        return result2 + (index ? " " : "") + word.toUpperCase();
      });
      var upperFirst = createCaseFirst("toUpperCase");
      function words(string, pattern, guard) {
        string = toString(string);
        pattern = guard ? undefined2 : pattern;
        if (pattern === undefined2) {
          return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
        }
        return string.match(pattern) || [];
      }
      var attempt = baseRest(function(func, args) {
        try {
          return apply(func, undefined2, args);
        } catch (e) {
          return isError(e) ? e : new Error2(e);
        }
      });
      var bindAll = flatRest(function(object, methodNames) {
        arrayEach(methodNames, function(key) {
          key = toKey(key);
          baseAssignValue(object, key, bind(object[key], object));
        });
        return object;
      });
      function cond(pairs) {
        var length = pairs == null ? 0 : pairs.length, toIteratee = getIteratee();
        pairs = !length ? [] : arrayMap(pairs, function(pair) {
          if (typeof pair[1] != "function") {
            throw new TypeError2(FUNC_ERROR_TEXT);
          }
          return [toIteratee(pair[0]), pair[1]];
        });
        return baseRest(function(args) {
          var index = -1;
          while (++index < length) {
            var pair = pairs[index];
            if (apply(pair[0], this, args)) {
              return apply(pair[1], this, args);
            }
          }
        });
      }
      function conforms(source) {
        return baseConforms(baseClone(source, CLONE_DEEP_FLAG));
      }
      function constant(value) {
        return function() {
          return value;
        };
      }
      function defaultTo(value, defaultValue) {
        return value == null || value !== value ? defaultValue : value;
      }
      var flow = createFlow();
      var flowRight = createFlow(true);
      function identity(value) {
        return value;
      }
      function iteratee(func) {
        return baseIteratee(typeof func == "function" ? func : baseClone(func, CLONE_DEEP_FLAG));
      }
      function matches(source) {
        return baseMatches(baseClone(source, CLONE_DEEP_FLAG));
      }
      function matchesProperty(path, srcValue) {
        return baseMatchesProperty(path, baseClone(srcValue, CLONE_DEEP_FLAG));
      }
      var method = baseRest(function(path, args) {
        return function(object) {
          return baseInvoke(object, path, args);
        };
      });
      var methodOf = baseRest(function(object, args) {
        return function(path) {
          return baseInvoke(object, path, args);
        };
      });
      function mixin(object, source, options) {
        var props = keys(source), methodNames = baseFunctions(source, props);
        if (options == null && !(isObject(source) && (methodNames.length || !props.length))) {
          options = source;
          source = object;
          object = this;
          methodNames = baseFunctions(source, keys(source));
        }
        var chain2 = !(isObject(options) && ("chain" in options)) || !!options.chain, isFunc = isFunction(object);
        arrayEach(methodNames, function(methodName) {
          var func = source[methodName];
          object[methodName] = func;
          if (isFunc) {
            object.prototype[methodName] = function() {
              var chainAll = this.__chain__;
              if (chain2 || chainAll) {
                var result2 = object(this.__wrapped__), actions = result2.__actions__ = copyArray(this.__actions__);
                actions.push({ func, args: arguments, thisArg: object });
                result2.__chain__ = chainAll;
                return result2;
              }
              return func.apply(object, arrayPush([this.value()], arguments));
            };
          }
        });
        return object;
      }
      function noConflict() {
        if (root._ === this) {
          root._ = oldDash;
        }
        return this;
      }
      function noop() {}
      function nthArg(n) {
        n = toInteger(n);
        return baseRest(function(args) {
          return baseNth(args, n);
        });
      }
      var over = createOver(arrayMap);
      var overEvery = createOver(arrayEvery);
      var overSome = createOver(arraySome);
      function property(path) {
        return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
      }
      function propertyOf(object) {
        return function(path) {
          return object == null ? undefined2 : baseGet(object, path);
        };
      }
      var range = createRange();
      var rangeRight = createRange(true);
      function stubArray() {
        return [];
      }
      function stubFalse() {
        return false;
      }
      function stubObject() {
        return {};
      }
      function stubString() {
        return "";
      }
      function stubTrue() {
        return true;
      }
      function times(n, iteratee2) {
        n = toInteger(n);
        if (n < 1 || n > MAX_SAFE_INTEGER) {
          return [];
        }
        var index = MAX_ARRAY_LENGTH, length = nativeMin(n, MAX_ARRAY_LENGTH);
        iteratee2 = getIteratee(iteratee2);
        n -= MAX_ARRAY_LENGTH;
        var result2 = baseTimes(length, iteratee2);
        while (++index < n) {
          iteratee2(index);
        }
        return result2;
      }
      function toPath(value) {
        if (isArray(value)) {
          return arrayMap(value, toKey);
        }
        return isSymbol(value) ? [value] : copyArray(stringToPath(toString(value)));
      }
      function uniqueId(prefix) {
        var id = ++idCounter;
        return toString(prefix) + id;
      }
      var add = createMathOperation(function(augend, addend) {
        return augend + addend;
      }, 0);
      var ceil = createRound("ceil");
      var divide = createMathOperation(function(dividend, divisor) {
        return dividend / divisor;
      }, 1);
      var floor = createRound("floor");
      function max(array) {
        return array && array.length ? baseExtremum(array, identity, baseGt) : undefined2;
      }
      function maxBy(array, iteratee2) {
        return array && array.length ? baseExtremum(array, getIteratee(iteratee2, 2), baseGt) : undefined2;
      }
      function mean(array) {
        return baseMean(array, identity);
      }
      function meanBy(array, iteratee2) {
        return baseMean(array, getIteratee(iteratee2, 2));
      }
      function min(array) {
        return array && array.length ? baseExtremum(array, identity, baseLt) : undefined2;
      }
      function minBy(array, iteratee2) {
        return array && array.length ? baseExtremum(array, getIteratee(iteratee2, 2), baseLt) : undefined2;
      }
      var multiply = createMathOperation(function(multiplier, multiplicand) {
        return multiplier * multiplicand;
      }, 1);
      var round = createRound("round");
      var subtract = createMathOperation(function(minuend, subtrahend) {
        return minuend - subtrahend;
      }, 0);
      function sum(array) {
        return array && array.length ? baseSum(array, identity) : 0;
      }
      function sumBy(array, iteratee2) {
        return array && array.length ? baseSum(array, getIteratee(iteratee2, 2)) : 0;
      }
      lodash.after = after;
      lodash.ary = ary;
      lodash.assign = assign;
      lodash.assignIn = assignIn;
      lodash.assignInWith = assignInWith;
      lodash.assignWith = assignWith;
      lodash.at = at;
      lodash.before = before;
      lodash.bind = bind;
      lodash.bindAll = bindAll;
      lodash.bindKey = bindKey;
      lodash.castArray = castArray;
      lodash.chain = chain;
      lodash.chunk = chunk;
      lodash.compact = compact;
      lodash.concat = concat;
      lodash.cond = cond;
      lodash.conforms = conforms;
      lodash.constant = constant;
      lodash.countBy = countBy;
      lodash.create = create;
      lodash.curry = curry;
      lodash.curryRight = curryRight;
      lodash.debounce = debounce;
      lodash.defaults = defaults;
      lodash.defaultsDeep = defaultsDeep;
      lodash.defer = defer;
      lodash.delay = delay;
      lodash.difference = difference;
      lodash.differenceBy = differenceBy;
      lodash.differenceWith = differenceWith;
      lodash.drop = drop;
      lodash.dropRight = dropRight;
      lodash.dropRightWhile = dropRightWhile;
      lodash.dropWhile = dropWhile;
      lodash.fill = fill;
      lodash.filter = filter;
      lodash.flatMap = flatMap;
      lodash.flatMapDeep = flatMapDeep;
      lodash.flatMapDepth = flatMapDepth;
      lodash.flatten = flatten;
      lodash.flattenDeep = flattenDeep;
      lodash.flattenDepth = flattenDepth;
      lodash.flip = flip;
      lodash.flow = flow;
      lodash.flowRight = flowRight;
      lodash.fromPairs = fromPairs;
      lodash.functions = functions;
      lodash.functionsIn = functionsIn;
      lodash.groupBy = groupBy;
      lodash.initial = initial;
      lodash.intersection = intersection;
      lodash.intersectionBy = intersectionBy;
      lodash.intersectionWith = intersectionWith;
      lodash.invert = invert;
      lodash.invertBy = invertBy;
      lodash.invokeMap = invokeMap;
      lodash.iteratee = iteratee;
      lodash.keyBy = keyBy;
      lodash.keys = keys;
      lodash.keysIn = keysIn;
      lodash.map = map;
      lodash.mapKeys = mapKeys;
      lodash.mapValues = mapValues;
      lodash.matches = matches;
      lodash.matchesProperty = matchesProperty;
      lodash.memoize = memoize;
      lodash.merge = merge;
      lodash.mergeWith = mergeWith;
      lodash.method = method;
      lodash.methodOf = methodOf;
      lodash.mixin = mixin;
      lodash.negate = negate;
      lodash.nthArg = nthArg;
      lodash.omit = omit;
      lodash.omitBy = omitBy;
      lodash.once = once;
      lodash.orderBy = orderBy;
      lodash.over = over;
      lodash.overArgs = overArgs;
      lodash.overEvery = overEvery;
      lodash.overSome = overSome;
      lodash.partial = partial;
      lodash.partialRight = partialRight;
      lodash.partition = partition;
      lodash.pick = pick;
      lodash.pickBy = pickBy;
      lodash.property = property;
      lodash.propertyOf = propertyOf;
      lodash.pull = pull;
      lodash.pullAll = pullAll;
      lodash.pullAllBy = pullAllBy;
      lodash.pullAllWith = pullAllWith;
      lodash.pullAt = pullAt;
      lodash.range = range;
      lodash.rangeRight = rangeRight;
      lodash.rearg = rearg;
      lodash.reject = reject;
      lodash.remove = remove;
      lodash.rest = rest;
      lodash.reverse = reverse;
      lodash.sampleSize = sampleSize;
      lodash.set = set;
      lodash.setWith = setWith;
      lodash.shuffle = shuffle;
      lodash.slice = slice;
      lodash.sortBy = sortBy;
      lodash.sortedUniq = sortedUniq;
      lodash.sortedUniqBy = sortedUniqBy;
      lodash.split = split;
      lodash.spread = spread;
      lodash.tail = tail;
      lodash.take = take;
      lodash.takeRight = takeRight;
      lodash.takeRightWhile = takeRightWhile;
      lodash.takeWhile = takeWhile;
      lodash.tap = tap;
      lodash.throttle = throttle;
      lodash.thru = thru;
      lodash.toArray = toArray;
      lodash.toPairs = toPairs;
      lodash.toPairsIn = toPairsIn;
      lodash.toPath = toPath;
      lodash.toPlainObject = toPlainObject;
      lodash.transform = transform;
      lodash.unary = unary;
      lodash.union = union;
      lodash.unionBy = unionBy;
      lodash.unionWith = unionWith;
      lodash.uniq = uniq;
      lodash.uniqBy = uniqBy;
      lodash.uniqWith = uniqWith;
      lodash.unset = unset;
      lodash.unzip = unzip;
      lodash.unzipWith = unzipWith;
      lodash.update = update;
      lodash.updateWith = updateWith;
      lodash.values = values;
      lodash.valuesIn = valuesIn;
      lodash.without = without;
      lodash.words = words;
      lodash.wrap = wrap;
      lodash.xor = xor;
      lodash.xorBy = xorBy;
      lodash.xorWith = xorWith;
      lodash.zip = zip;
      lodash.zipObject = zipObject;
      lodash.zipObjectDeep = zipObjectDeep;
      lodash.zipWith = zipWith;
      lodash.entries = toPairs;
      lodash.entriesIn = toPairsIn;
      lodash.extend = assignIn;
      lodash.extendWith = assignInWith;
      mixin(lodash, lodash);
      lodash.add = add;
      lodash.attempt = attempt;
      lodash.camelCase = camelCase;
      lodash.capitalize = capitalize;
      lodash.ceil = ceil;
      lodash.clamp = clamp;
      lodash.clone = clone;
      lodash.cloneDeep = cloneDeep;
      lodash.cloneDeepWith = cloneDeepWith;
      lodash.cloneWith = cloneWith;
      lodash.conformsTo = conformsTo;
      lodash.deburr = deburr;
      lodash.defaultTo = defaultTo;
      lodash.divide = divide;
      lodash.endsWith = endsWith;
      lodash.eq = eq;
      lodash.escape = escape2;
      lodash.escapeRegExp = escapeRegExp;
      lodash.every = every;
      lodash.find = find;
      lodash.findIndex = findIndex;
      lodash.findKey = findKey;
      lodash.findLast = findLast;
      lodash.findLastIndex = findLastIndex;
      lodash.findLastKey = findLastKey;
      lodash.floor = floor;
      lodash.forEach = forEach;
      lodash.forEachRight = forEachRight;
      lodash.forIn = forIn;
      lodash.forInRight = forInRight;
      lodash.forOwn = forOwn;
      lodash.forOwnRight = forOwnRight;
      lodash.get = get;
      lodash.gt = gt;
      lodash.gte = gte;
      lodash.has = has;
      lodash.hasIn = hasIn;
      lodash.head = head;
      lodash.identity = identity;
      lodash.includes = includes;
      lodash.indexOf = indexOf;
      lodash.inRange = inRange;
      lodash.invoke = invoke;
      lodash.isArguments = isArguments;
      lodash.isArray = isArray;
      lodash.isArrayBuffer = isArrayBuffer;
      lodash.isArrayLike = isArrayLike;
      lodash.isArrayLikeObject = isArrayLikeObject;
      lodash.isBoolean = isBoolean;
      lodash.isBuffer = isBuffer;
      lodash.isDate = isDate;
      lodash.isElement = isElement;
      lodash.isEmpty = isEmpty;
      lodash.isEqual = isEqual;
      lodash.isEqualWith = isEqualWith;
      lodash.isError = isError;
      lodash.isFinite = isFinite;
      lodash.isFunction = isFunction;
      lodash.isInteger = isInteger;
      lodash.isLength = isLength;
      lodash.isMap = isMap;
      lodash.isMatch = isMatch;
      lodash.isMatchWith = isMatchWith;
      lodash.isNaN = isNaN;
      lodash.isNative = isNative;
      lodash.isNil = isNil;
      lodash.isNull = isNull;
      lodash.isNumber = isNumber;
      lodash.isObject = isObject;
      lodash.isObjectLike = isObjectLike;
      lodash.isPlainObject = isPlainObject;
      lodash.isRegExp = isRegExp;
      lodash.isSafeInteger = isSafeInteger;
      lodash.isSet = isSet;
      lodash.isString = isString;
      lodash.isSymbol = isSymbol;
      lodash.isTypedArray = isTypedArray;
      lodash.isUndefined = isUndefined;
      lodash.isWeakMap = isWeakMap;
      lodash.isWeakSet = isWeakSet;
      lodash.join = join;
      lodash.kebabCase = kebabCase;
      lodash.last = last;
      lodash.lastIndexOf = lastIndexOf;
      lodash.lowerCase = lowerCase;
      lodash.lowerFirst = lowerFirst;
      lodash.lt = lt;
      lodash.lte = lte;
      lodash.max = max;
      lodash.maxBy = maxBy;
      lodash.mean = mean;
      lodash.meanBy = meanBy;
      lodash.min = min;
      lodash.minBy = minBy;
      lodash.stubArray = stubArray;
      lodash.stubFalse = stubFalse;
      lodash.stubObject = stubObject;
      lodash.stubString = stubString;
      lodash.stubTrue = stubTrue;
      lodash.multiply = multiply;
      lodash.nth = nth;
      lodash.noConflict = noConflict;
      lodash.noop = noop;
      lodash.now = now;
      lodash.pad = pad;
      lodash.padEnd = padEnd;
      lodash.padStart = padStart;
      lodash.parseInt = parseInt2;
      lodash.random = random;
      lodash.reduce = reduce;
      lodash.reduceRight = reduceRight;
      lodash.repeat = repeat;
      lodash.replace = replace;
      lodash.result = result;
      lodash.round = round;
      lodash.runInContext = runInContext2;
      lodash.sample = sample;
      lodash.size = size;
      lodash.snakeCase = snakeCase;
      lodash.some = some;
      lodash.sortedIndex = sortedIndex;
      lodash.sortedIndexBy = sortedIndexBy;
      lodash.sortedIndexOf = sortedIndexOf;
      lodash.sortedLastIndex = sortedLastIndex;
      lodash.sortedLastIndexBy = sortedLastIndexBy;
      lodash.sortedLastIndexOf = sortedLastIndexOf;
      lodash.startCase = startCase;
      lodash.startsWith = startsWith;
      lodash.subtract = subtract;
      lodash.sum = sum;
      lodash.sumBy = sumBy;
      lodash.template = template;
      lodash.times = times;
      lodash.toFinite = toFinite;
      lodash.toInteger = toInteger;
      lodash.toLength = toLength;
      lodash.toLower = toLower;
      lodash.toNumber = toNumber;
      lodash.toSafeInteger = toSafeInteger;
      lodash.toString = toString;
      lodash.toUpper = toUpper;
      lodash.trim = trim;
      lodash.trimEnd = trimEnd;
      lodash.trimStart = trimStart;
      lodash.truncate = truncate;
      lodash.unescape = unescape2;
      lodash.uniqueId = uniqueId;
      lodash.upperCase = upperCase;
      lodash.upperFirst = upperFirst;
      lodash.each = forEach;
      lodash.eachRight = forEachRight;
      lodash.first = head;
      mixin(lodash, function() {
        var source = {};
        baseForOwn(lodash, function(func, methodName) {
          if (!hasOwnProperty.call(lodash.prototype, methodName)) {
            source[methodName] = func;
          }
        });
        return source;
      }(), { chain: false });
      lodash.VERSION = VERSION;
      arrayEach(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(methodName) {
        lodash[methodName].placeholder = lodash;
      });
      arrayEach(["drop", "take"], function(methodName, index) {
        LazyWrapper.prototype[methodName] = function(n) {
          n = n === undefined2 ? 1 : nativeMax(toInteger(n), 0);
          var result2 = this.__filtered__ && !index ? new LazyWrapper(this) : this.clone();
          if (result2.__filtered__) {
            result2.__takeCount__ = nativeMin(n, result2.__takeCount__);
          } else {
            result2.__views__.push({
              size: nativeMin(n, MAX_ARRAY_LENGTH),
              type: methodName + (result2.__dir__ < 0 ? "Right" : "")
            });
          }
          return result2;
        };
        LazyWrapper.prototype[methodName + "Right"] = function(n) {
          return this.reverse()[methodName](n).reverse();
        };
      });
      arrayEach(["filter", "map", "takeWhile"], function(methodName, index) {
        var type = index + 1, isFilter = type == LAZY_FILTER_FLAG || type == LAZY_WHILE_FLAG;
        LazyWrapper.prototype[methodName] = function(iteratee2) {
          var result2 = this.clone();
          result2.__iteratees__.push({
            iteratee: getIteratee(iteratee2, 3),
            type
          });
          result2.__filtered__ = result2.__filtered__ || isFilter;
          return result2;
        };
      });
      arrayEach(["head", "last"], function(methodName, index) {
        var takeName = "take" + (index ? "Right" : "");
        LazyWrapper.prototype[methodName] = function() {
          return this[takeName](1).value()[0];
        };
      });
      arrayEach(["initial", "tail"], function(methodName, index) {
        var dropName = "drop" + (index ? "" : "Right");
        LazyWrapper.prototype[methodName] = function() {
          return this.__filtered__ ? new LazyWrapper(this) : this[dropName](1);
        };
      });
      LazyWrapper.prototype.compact = function() {
        return this.filter(identity);
      };
      LazyWrapper.prototype.find = function(predicate) {
        return this.filter(predicate).head();
      };
      LazyWrapper.prototype.findLast = function(predicate) {
        return this.reverse().find(predicate);
      };
      LazyWrapper.prototype.invokeMap = baseRest(function(path, args) {
        if (typeof path == "function") {
          return new LazyWrapper(this);
        }
        return this.map(function(value) {
          return baseInvoke(value, path, args);
        });
      });
      LazyWrapper.prototype.reject = function(predicate) {
        return this.filter(negate(getIteratee(predicate)));
      };
      LazyWrapper.prototype.slice = function(start, end) {
        start = toInteger(start);
        var result2 = this;
        if (result2.__filtered__ && (start > 0 || end < 0)) {
          return new LazyWrapper(result2);
        }
        if (start < 0) {
          result2 = result2.takeRight(-start);
        } else if (start) {
          result2 = result2.drop(start);
        }
        if (end !== undefined2) {
          end = toInteger(end);
          result2 = end < 0 ? result2.dropRight(-end) : result2.take(end - start);
        }
        return result2;
      };
      LazyWrapper.prototype.takeRightWhile = function(predicate) {
        return this.reverse().takeWhile(predicate).reverse();
      };
      LazyWrapper.prototype.toArray = function() {
        return this.take(MAX_ARRAY_LENGTH);
      };
      baseForOwn(LazyWrapper.prototype, function(func, methodName) {
        var checkIteratee = /^(?:filter|find|map|reject)|While$/.test(methodName), isTaker = /^(?:head|last)$/.test(methodName), lodashFunc = lodash[isTaker ? "take" + (methodName == "last" ? "Right" : "") : methodName], retUnwrapped = isTaker || /^find/.test(methodName);
        if (!lodashFunc) {
          return;
        }
        lodash.prototype[methodName] = function() {
          var value = this.__wrapped__, args = isTaker ? [1] : arguments, isLazy = value instanceof LazyWrapper, iteratee2 = args[0], useLazy = isLazy || isArray(value);
          var interceptor = function(value2) {
            var result3 = lodashFunc.apply(lodash, arrayPush([value2], args));
            return isTaker && chainAll ? result3[0] : result3;
          };
          if (useLazy && checkIteratee && typeof iteratee2 == "function" && iteratee2.length != 1) {
            isLazy = useLazy = false;
          }
          var chainAll = this.__chain__, isHybrid = !!this.__actions__.length, isUnwrapped = retUnwrapped && !chainAll, onlyLazy = isLazy && !isHybrid;
          if (!retUnwrapped && useLazy) {
            value = onlyLazy ? value : new LazyWrapper(this);
            var result2 = func.apply(value, args);
            result2.__actions__.push({ func: thru, args: [interceptor], thisArg: undefined2 });
            return new LodashWrapper(result2, chainAll);
          }
          if (isUnwrapped && onlyLazy) {
            return func.apply(this, args);
          }
          result2 = this.thru(interceptor);
          return isUnwrapped ? isTaker ? result2.value()[0] : result2.value() : result2;
        };
      });
      arrayEach(["pop", "push", "shift", "sort", "splice", "unshift"], function(methodName) {
        var func = arrayProto[methodName], chainName = /^(?:push|sort|unshift)$/.test(methodName) ? "tap" : "thru", retUnwrapped = /^(?:pop|shift)$/.test(methodName);
        lodash.prototype[methodName] = function() {
          var args = arguments;
          if (retUnwrapped && !this.__chain__) {
            var value = this.value();
            return func.apply(isArray(value) ? value : [], args);
          }
          return this[chainName](function(value2) {
            return func.apply(isArray(value2) ? value2 : [], args);
          });
        };
      });
      baseForOwn(LazyWrapper.prototype, function(func, methodName) {
        var lodashFunc = lodash[methodName];
        if (lodashFunc) {
          var key = lodashFunc.name + "";
          if (!hasOwnProperty.call(realNames, key)) {
            realNames[key] = [];
          }
          realNames[key].push({ name: methodName, func: lodashFunc });
        }
      });
      realNames[createHybrid(undefined2, WRAP_BIND_KEY_FLAG).name] = [{
        name: "wrapper",
        func: undefined2
      }];
      LazyWrapper.prototype.clone = lazyClone;
      LazyWrapper.prototype.reverse = lazyReverse;
      LazyWrapper.prototype.value = lazyValue;
      lodash.prototype.at = wrapperAt;
      lodash.prototype.chain = wrapperChain;
      lodash.prototype.commit = wrapperCommit;
      lodash.prototype.next = wrapperNext;
      lodash.prototype.plant = wrapperPlant;
      lodash.prototype.reverse = wrapperReverse;
      lodash.prototype.toJSON = lodash.prototype.valueOf = lodash.prototype.value = wrapperValue;
      lodash.prototype.first = lodash.prototype.head;
      if (symIterator) {
        lodash.prototype[symIterator] = wrapperToIterator;
      }
      return lodash;
    };
    var _ = runInContext();
    if (typeof define == "function" && typeof define.amd == "object" && define.amd) {
      root._ = _;
      define(function() {
        return _;
      });
    } else if (freeModule) {
      (freeModule.exports = _)._ = _;
      freeExports._ = _;
    } else {
      root._ = _;
    }
  }).call(exports);
});

// node_modules/deepmerge/dist/cjs.js
var require_cjs = __commonJS(function(exports, module) {
  var isMergeableObject = function isMergeableObject2(value) {
    return isNonNullObject(value) && !isSpecial(value);
  };
  function isNonNullObject(value) {
    return !!value && typeof value === "object";
  }
  function isSpecial(value) {
    var stringValue = Object.prototype.toString.call(value);
    return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
  }
  var canUseSymbol = typeof Symbol === "function" && Symbol.for;
  var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for("react.element") : 60103;
  function isReactElement(value) {
    return value.$$typeof === REACT_ELEMENT_TYPE;
  }
  function emptyTarget(val) {
    return Array.isArray(val) ? [] : {};
  }
  function cloneUnlessOtherwiseSpecified(value, options) {
    return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
  }
  function defaultArrayMerge(target, source, options) {
    return target.concat(source).map(function(element) {
      return cloneUnlessOtherwiseSpecified(element, options);
    });
  }
  function getMergeFunction(key, options) {
    if (!options.customMerge) {
      return deepmerge;
    }
    var customMerge = options.customMerge(key);
    return typeof customMerge === "function" ? customMerge : deepmerge;
  }
  function getEnumerableOwnPropertySymbols(target) {
    return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
      return Object.propertyIsEnumerable.call(target, symbol);
    }) : [];
  }
  function getKeys(target) {
    return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
  }
  function propertyIsOnObject(object, property) {
    try {
      return property in object;
    } catch (_) {
      return false;
    }
  }
  function propertyIsUnsafe(target, key) {
    return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
  }
  function mergeObject(target, source, options) {
    var destination = {};
    if (options.isMergeableObject(target)) {
      getKeys(target).forEach(function(key) {
        destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
      });
    }
    getKeys(source).forEach(function(key) {
      if (propertyIsUnsafe(target, key)) {
        return;
      }
      if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
        destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
      } else {
        destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
      }
    });
    return destination;
  }
  function deepmerge(target, source, options) {
    options = options || {};
    options.arrayMerge = options.arrayMerge || defaultArrayMerge;
    options.isMergeableObject = options.isMergeableObject || isMergeableObject;
    options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
    var sourceIsArray = Array.isArray(source);
    var targetIsArray = Array.isArray(target);
    var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
    if (!sourceAndTargetTypesMatch) {
      return cloneUnlessOtherwiseSpecified(source, options);
    } else if (sourceIsArray) {
      return options.arrayMerge(target, source, options);
    } else {
      return mergeObject(target, source, options);
    }
  }
  deepmerge.all = function deepmergeAll(array, options) {
    if (!Array.isArray(array)) {
      throw new Error("first argument should be an array");
    }
    return array.reduce(function(prev, next) {
      return deepmerge(prev, next, options);
    }, {});
  };
  var deepmerge_1 = deepmerge;
  module.exports = deepmerge_1;
});

// node_modules/pkce-challenge/dist/module.js
var import_lib_typedarrays = __toESM(require_lib_typedarrays(), 1);
var import_sha256 = __toESM(require_sha256(), 1);
var import_enc_base64url = __toESM(require_enc_base64url(), 1);
function $d415641d0cfd8c85$var$toBytesInt32(num) {
  const arr = new ArrayBuffer(4);
  const view = new DataView(arr);
  view.setUint32(0, num, false);
  return arr;
}
function $d415641d0cfd8c85$var$getRandomValues(size) {
  const randoms = import_lib_typedarrays.default.random(size);
  const randoms1byte = [];
  randoms.words.forEach((word) => {
    const arr = $d415641d0cfd8c85$var$toBytesInt32(word);
    const fourByteWord = new Uint8Array(arr);
    for (let i = 0;i < 4; i++)
      randoms1byte.push(fourByteWord[i]);
  });
  return randoms1byte;
}
function $d415641d0cfd8c85$var$random(size) {
  const mask = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
  let result = "";
  const randomUints = $d415641d0cfd8c85$var$getRandomValues(size);
  for (let i = 0;i < size; i++) {
    const randomIndex = randomUints[i] % mask.length;
    result += mask[randomIndex];
  }
  return result;
}
function $d415641d0cfd8c85$var$generateVerifier(length) {
  return $d415641d0cfd8c85$var$random(length);
}
function $d415641d0cfd8c85$export$6a61b14641fe7480(code_verifier) {
  return import_sha256.default(code_verifier).toString(import_enc_base64url.default);
}
function $d415641d0cfd8c85$export$2e2bcd8739ae039(length) {
  if (!length)
    length = 43;
  if (length < 43 || length > 128)
    throw `Expected a length between 43 and 128. Received ${length}.`;
  const verifier = $d415641d0cfd8c85$var$generateVerifier(length);
  const challenge = $d415641d0cfd8c85$export$6a61b14641fe7480(verifier);
  return {
    code_verifier: verifier,
    code_challenge: challenge
  };
}

// src/fhirSearchQueries.ts
var BASE_SEARCH_QUERIES = [
  { resourceType: "Observation", params: { category: "laboratory" } },
  { resourceType: "Observation", params: { category: "vital-signs" } },
  { resourceType: "Observation", params: { category: "social-history" } },
  { resourceType: "Observation", params: { category: "sdoh" } },
  { resourceType: "Observation", params: { category: "functional-status" } },
  { resourceType: "Observation", params: { category: "disability-status" } },
  { resourceType: "Observation", params: { category: "mental-health" } },
  { resourceType: "Condition", params: {} },
  { resourceType: "MedicationRequest", params: {} },
  { resourceType: "AllergyIntolerance", params: {} },
  { resourceType: "Immunization", params: {} },
  { resourceType: "Procedure", params: {} },
  { resourceType: "DiagnosticReport", params: {} },
  { resourceType: "DocumentReference", params: {} },
  { resourceType: "CarePlan", params: {} },
  { resourceType: "CareTeam", params: {} },
  { resourceType: "Coverage", params: {} },
  { resourceType: "Device", params: {} },
  { resourceType: "Encounter", params: {} },
  { resourceType: "Goal", params: {} },
  { resourceType: "MedicationDispense", params: {} },
  { resourceType: "MedicationStatement", params: {} },
  { resourceType: "QuestionnaireResponse", params: {} },
  { resourceType: "RelatedPerson", params: {} },
  { resourceType: "Specimen", params: {} },
  { resourceType: "ServiceRequest", params: {} },
  { resourceType: "Patient", params: {} }
];
function getInitialFhirSearchQueries(patientId) {
  return BASE_SEARCH_QUERIES.map((baseQuery) => ({
    ...baseQuery,
    params: {
      ...baseQuery.params || {},
      patient: patientId
    }
  }));
}

// clientFhirUtils.ts
var import_lodash = __toESM(require_lodash(), 1);

// node_modules/domelementtype/lib/esm/index.js
var ElementType;
(function(ElementType2) {
  ElementType2["Root"] = "root";
  ElementType2["Text"] = "text";
  ElementType2["Directive"] = "directive";
  ElementType2["Comment"] = "comment";
  ElementType2["Script"] = "script";
  ElementType2["Style"] = "style";
  ElementType2["Tag"] = "tag";
  ElementType2["CDATA"] = "cdata";
  ElementType2["Doctype"] = "doctype";
})(ElementType || (ElementType = {}));
function isTag(elem) {
  return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
}
var Root = ElementType.Root;
var Text = ElementType.Text;
var Directive = ElementType.Directive;
var Comment = ElementType.Comment;
var Script = ElementType.Script;
var Style = ElementType.Style;
var Tag = ElementType.Tag;
var CDATA = ElementType.CDATA;
var Doctype = ElementType.Doctype;

// node_modules/domhandler/lib/esm/node.js
class Node {
  constructor() {
    this.parent = null;
    this.prev = null;
    this.next = null;
    this.startIndex = null;
    this.endIndex = null;
  }
  get parentNode() {
    return this.parent;
  }
  set parentNode(parent) {
    this.parent = parent;
  }
  get previousSibling() {
    return this.prev;
  }
  set previousSibling(prev) {
    this.prev = prev;
  }
  get nextSibling() {
    return this.next;
  }
  set nextSibling(next) {
    this.next = next;
  }
  cloneNode(recursive = false) {
    return cloneNode(this, recursive);
  }
}

class DataNode extends Node {
  constructor(data) {
    super();
    this.data = data;
  }
  get nodeValue() {
    return this.data;
  }
  set nodeValue(data) {
    this.data = data;
  }
}

class Text2 extends DataNode {
  constructor() {
    super(...arguments);
    this.type = ElementType.Text;
  }
  get nodeType() {
    return 3;
  }
}

class Comment2 extends DataNode {
  constructor() {
    super(...arguments);
    this.type = ElementType.Comment;
  }
  get nodeType() {
    return 8;
  }
}

class ProcessingInstruction extends DataNode {
  constructor(name, data) {
    super(data);
    this.name = name;
    this.type = ElementType.Directive;
  }
  get nodeType() {
    return 1;
  }
}

class NodeWithChildren extends Node {
  constructor(children) {
    super();
    this.children = children;
  }
  get firstChild() {
    var _a;
    return (_a = this.children[0]) !== null && _a !== undefined ? _a : null;
  }
  get lastChild() {
    return this.children.length > 0 ? this.children[this.children.length - 1] : null;
  }
  get childNodes() {
    return this.children;
  }
  set childNodes(children) {
    this.children = children;
  }
}

class CDATA2 extends NodeWithChildren {
  constructor() {
    super(...arguments);
    this.type = ElementType.CDATA;
  }
  get nodeType() {
    return 4;
  }
}

class Document extends NodeWithChildren {
  constructor() {
    super(...arguments);
    this.type = ElementType.Root;
  }
  get nodeType() {
    return 9;
  }
}

class Element extends NodeWithChildren {
  constructor(name, attribs, children = [], type = name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag) {
    super(children);
    this.name = name;
    this.attribs = attribs;
    this.type = type;
  }
  get nodeType() {
    return 1;
  }
  get tagName() {
    return this.name;
  }
  set tagName(name) {
    this.name = name;
  }
  get attributes() {
    return Object.keys(this.attribs).map((name) => {
      var _a, _b;
      return {
        name,
        value: this.attribs[name],
        namespace: (_a = this["x-attribsNamespace"]) === null || _a === undefined ? undefined : _a[name],
        prefix: (_b = this["x-attribsPrefix"]) === null || _b === undefined ? undefined : _b[name]
      };
    });
  }
}
function isTag2(node) {
  return isTag(node);
}
function isCDATA(node) {
  return node.type === ElementType.CDATA;
}
function isText(node) {
  return node.type === ElementType.Text;
}
function isComment(node) {
  return node.type === ElementType.Comment;
}
function isDirective(node) {
  return node.type === ElementType.Directive;
}
function isDocument(node) {
  return node.type === ElementType.Root;
}
function cloneNode(node, recursive = false) {
  let result;
  if (isText(node)) {
    result = new Text2(node.data);
  } else if (isComment(node)) {
    result = new Comment2(node.data);
  } else if (isTag2(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new Element(node.name, { ...node.attribs }, children);
    children.forEach((child) => child.parent = clone);
    if (node.namespace != null) {
      clone.namespace = node.namespace;
    }
    if (node["x-attribsNamespace"]) {
      clone["x-attribsNamespace"] = { ...node["x-attribsNamespace"] };
    }
    if (node["x-attribsPrefix"]) {
      clone["x-attribsPrefix"] = { ...node["x-attribsPrefix"] };
    }
    result = clone;
  } else if (isCDATA(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new CDATA2(children);
    children.forEach((child) => child.parent = clone);
    result = clone;
  } else if (isDocument(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new Document(children);
    children.forEach((child) => child.parent = clone);
    if (node["x-mode"]) {
      clone["x-mode"] = node["x-mode"];
    }
    result = clone;
  } else if (isDirective(node)) {
    const instruction = new ProcessingInstruction(node.name, node.data);
    if (node["x-name"] != null) {
      instruction["x-name"] = node["x-name"];
      instruction["x-publicId"] = node["x-publicId"];
      instruction["x-systemId"] = node["x-systemId"];
    }
    result = instruction;
  } else {
    throw new Error(`Not implemented yet: ${node.type}`);
  }
  result.startIndex = node.startIndex;
  result.endIndex = node.endIndex;
  if (node.sourceCodeLocation != null) {
    result.sourceCodeLocation = node.sourceCodeLocation;
  }
  return result;
}
function cloneChildren(childs) {
  const children = childs.map((child) => cloneNode(child, true));
  for (let i = 1;i < children.length; i++) {
    children[i].prev = children[i - 1];
    children[i - 1].next = children[i];
  }
  return children;
}

// node_modules/domhandler/lib/esm/index.js
var defaultOpts = {
  withStartIndices: false,
  withEndIndices: false,
  xmlMode: false
};

class DomHandler {
  constructor(callback, options, elementCB) {
    this.dom = [];
    this.root = new Document(this.dom);
    this.done = false;
    this.tagStack = [this.root];
    this.lastNode = null;
    this.parser = null;
    if (typeof options === "function") {
      elementCB = options;
      options = defaultOpts;
    }
    if (typeof callback === "object") {
      options = callback;
      callback = undefined;
    }
    this.callback = callback !== null && callback !== undefined ? callback : null;
    this.options = options !== null && options !== undefined ? options : defaultOpts;
    this.elementCB = elementCB !== null && elementCB !== undefined ? elementCB : null;
  }
  onparserinit(parser) {
    this.parser = parser;
  }
  onreset() {
    this.dom = [];
    this.root = new Document(this.dom);
    this.done = false;
    this.tagStack = [this.root];
    this.lastNode = null;
    this.parser = null;
  }
  onend() {
    if (this.done)
      return;
    this.done = true;
    this.parser = null;
    this.handleCallback(null);
  }
  onerror(error) {
    this.handleCallback(error);
  }
  onclosetag() {
    this.lastNode = null;
    const elem = this.tagStack.pop();
    if (this.options.withEndIndices) {
      elem.endIndex = this.parser.endIndex;
    }
    if (this.elementCB)
      this.elementCB(elem);
  }
  onopentag(name, attribs) {
    const type = this.options.xmlMode ? ElementType.Tag : undefined;
    const element = new Element(name, attribs, undefined, type);
    this.addNode(element);
    this.tagStack.push(element);
  }
  ontext(data) {
    const { lastNode } = this;
    if (lastNode && lastNode.type === ElementType.Text) {
      lastNode.data += data;
      if (this.options.withEndIndices) {
        lastNode.endIndex = this.parser.endIndex;
      }
    } else {
      const node2 = new Text2(data);
      this.addNode(node2);
      this.lastNode = node2;
    }
  }
  oncomment(data) {
    if (this.lastNode && this.lastNode.type === ElementType.Comment) {
      this.lastNode.data += data;
      return;
    }
    const node2 = new Comment2(data);
    this.addNode(node2);
    this.lastNode = node2;
  }
  oncommentend() {
    this.lastNode = null;
  }
  oncdatastart() {
    const text = new Text2("");
    const node2 = new CDATA2([text]);
    this.addNode(node2);
    text.parent = node2;
    this.lastNode = text;
  }
  oncdataend() {
    this.lastNode = null;
  }
  onprocessinginstruction(name, data) {
    const node2 = new ProcessingInstruction(name, data);
    this.addNode(node2);
  }
  handleCallback(error) {
    if (typeof this.callback === "function") {
      this.callback(error, this.dom);
    } else if (error) {
      throw error;
    }
  }
  addNode(node2) {
    const parent = this.tagStack[this.tagStack.length - 1];
    const previousSibling = parent.children[parent.children.length - 1];
    if (this.options.withStartIndices) {
      node2.startIndex = this.parser.startIndex;
    }
    if (this.options.withEndIndices) {
      node2.endIndex = this.parser.endIndex;
    }
    parent.children.push(node2);
    if (previousSibling) {
      node2.prev = previousSibling;
      previousSibling.next = node2;
    }
    node2.parent = parent;
    this.lastNode = null;
  }
}

// node_modules/leac/lib/leac.mjs
var e = /\n/g;
function n(n2) {
  const o = [...n2.matchAll(e)].map((e2) => e2.index || 0);
  o.unshift(-1);
  const s = t(o, 0, o.length);
  return (e2) => r(s, e2);
}
function t(e2, n2, r) {
  if (r - n2 == 1)
    return { offset: e2[n2], index: n2 + 1 };
  const o = Math.ceil((n2 + r) / 2), s = t(e2, n2, o), l = t(e2, o, r);
  return { offset: s.offset, low: s, high: l };
}
function r(e2, n2) {
  return function(e3) {
    return Object.prototype.hasOwnProperty.call(e3, "index");
  }(e2) ? { line: e2.index, column: n2 - e2.offset } : r(e2.high.offset < n2 ? e2.high : e2.low, n2);
}
function o(e2, t2 = "", r2 = {}) {
  const o2 = typeof t2 != "string" ? t2 : r2, l = typeof t2 == "string" ? t2 : "", c = e2.map(s), f = !!o2.lineNumbers;
  return function(e3, t3 = 0) {
    const r3 = f ? n(e3) : () => ({ line: 0, column: 0 });
    let o3 = t3;
    const s = [];
    e:
      for (;o3 < e3.length; ) {
        let n2 = false;
        for (const t4 of c) {
          t4.regex.lastIndex = o3;
          const c2 = t4.regex.exec(e3);
          if (c2 && c2[0].length > 0) {
            if (!t4.discard) {
              const e4 = r3(o3), n3 = typeof t4.replace == "string" ? c2[0].replace(new RegExp(t4.regex.source, t4.regex.flags), t4.replace) : c2[0];
              s.push({ state: l, name: t4.name, text: n3, offset: o3, len: c2[0].length, line: e4.line, column: e4.column });
            }
            if (o3 = t4.regex.lastIndex, n2 = true, t4.push) {
              const n3 = t4.push(e3, o3);
              s.push(...n3.tokens), o3 = n3.offset;
            }
            if (t4.pop)
              break e;
            break;
          }
        }
        if (!n2)
          break;
      }
    return { tokens: s, offset: o3, complete: e3.length <= o3 };
  };
}
function s(e2, n2) {
  return { ...e2, regex: l(e2, n2) };
}
function l(e2, n2) {
  if (e2.name.length === 0)
    throw new Error(`Rule #${n2} has empty name, which is not allowed.`);
  if (function(e3) {
    return Object.prototype.hasOwnProperty.call(e3, "regex");
  }(e2))
    return function(e3) {
      if (e3.global)
        throw new Error(`Regular expression /${e3.source}/${e3.flags} contains the global flag, which is not allowed.`);
      return e3.sticky ? e3 : new RegExp(e3.source, e3.flags + "y");
    }(e2.regex);
  if (function(e3) {
    return Object.prototype.hasOwnProperty.call(e3, "str");
  }(e2)) {
    if (e2.str.length === 0)
      throw new Error(`Rule #${n2} ("${e2.name}") has empty "str" property, which is not allowed.`);
    return new RegExp(c(e2.str), "y");
  }
  return new RegExp(c(e2.name), "y");
}
function c(e2) {
  return e2.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, "\\$&");
}

// node_modules/peberminta/lib/core.mjs
function token(onToken, onEnd) {
  return (data, i) => {
    let position = i;
    let value = undefined;
    if (i < data.tokens.length) {
      value = onToken(data.tokens[i], data, i);
      if (value !== undefined) {
        position++;
      }
    } else {
      onEnd?.(data, i);
    }
    return value === undefined ? { matched: false } : {
      matched: true,
      position,
      value
    };
  };
}
function mapInner(r2, f) {
  return r2.matched ? {
    matched: true,
    position: r2.position,
    value: f(r2.value, r2.position)
  } : r2;
}
function mapOuter(r2, f) {
  return r2.matched ? f(r2) : r2;
}
function map(p, mapper) {
  return (data, i) => mapInner(p(data, i), (v, j) => mapper(v, data, i, j));
}
function option(p, def) {
  return (data, i) => {
    const r2 = p(data, i);
    return r2.matched ? r2 : {
      matched: true,
      position: i,
      value: def
    };
  };
}
function choice(...ps) {
  return (data, i) => {
    for (const p of ps) {
      const result = p(data, i);
      if (result.matched) {
        return result;
      }
    }
    return { matched: false };
  };
}
function otherwise(pa, pb) {
  return (data, i) => {
    const r1 = pa(data, i);
    return r1.matched ? r1 : pb(data, i);
  };
}
function takeWhile(p, test) {
  return (data, i) => {
    const values = [];
    let success = true;
    do {
      const r2 = p(data, i);
      if (r2.matched && test(r2.value, values.length + 1, data, i, r2.position)) {
        values.push(r2.value);
        i = r2.position;
      } else {
        success = false;
      }
    } while (success);
    return {
      matched: true,
      position: i,
      value: values
    };
  };
}
function many(p) {
  return takeWhile(p, () => true);
}
function many1(p) {
  return ab(p, many(p), (head, tail) => [head, ...tail]);
}
function ab(pa, pb, join) {
  return (data, i) => mapOuter(pa(data, i), (ma) => mapInner(pb(data, ma.position), (vb, j) => join(ma.value, vb, data, i, j)));
}
function left(pa, pb) {
  return ab(pa, pb, (va) => va);
}
function right(pa, pb) {
  return ab(pa, pb, (va, vb) => vb);
}
function abc(pa, pb, pc, join) {
  return (data, i) => mapOuter(pa(data, i), (ma) => mapOuter(pb(data, ma.position), (mb) => mapInner(pc(data, mb.position), (vc, j) => join(ma.value, mb.value, vc, data, i, j))));
}
function middle(pa, pb, pc) {
  return abc(pa, pb, pc, (ra, rb) => rb);
}
function all(...ps) {
  return (data, i) => {
    const result = [];
    let position = i;
    for (const p of ps) {
      const r1 = p(data, position);
      if (r1.matched) {
        result.push(r1.value);
        position = r1.position;
      } else {
        return { matched: false };
      }
    }
    return {
      matched: true,
      position,
      value: result
    };
  };
}
function flatten(...ps) {
  return flatten1(all(...ps));
}
function flatten1(p) {
  return map(p, (vs) => vs.flatMap((v) => v));
}
function chainReduce(acc, f) {
  return (data, i) => {
    let loop = true;
    let acc1 = acc;
    let pos = i;
    do {
      const r2 = f(acc1, data, pos)(data, pos);
      if (r2.matched) {
        acc1 = r2.value;
        pos = r2.position;
      } else {
        loop = false;
      }
    } while (loop);
    return {
      matched: true,
      position: pos,
      value: acc1
    };
  };
}
function reduceLeft(acc, p, reducer) {
  return chainReduce(acc, (acc2) => map(p, (v, data, i, j) => reducer(acc2, v, data, i, j)));
}
function leftAssoc2(pLeft, pOper, pRight) {
  return chain(pLeft, (v0) => reduceLeft(v0, ab(pOper, pRight, (f, y) => [f, y]), (acc, [f, y]) => f(acc, y)));
}
function chain(p, f) {
  return (data, i) => mapOuter(p(data, i), (m1) => f(m1.value, data, i, m1.position)(data, m1.position));
}

// node_modules/parseley/lib/parseley.mjs
var ws = `(?:[ \\t\\r\\n\\f]*)`;
var nl = `(?:\\n|\\r\\n|\\r|\\f)`;
var nonascii = `[^\\x00-\\x7F]`;
var unicode = `(?:\\\\[0-9a-f]{1,6}(?:\\r\\n|[ \\n\\r\\t\\f])?)`;
var escape2 = `(?:\\\\[^\\n\\r\\f0-9a-f])`;
var nmstart = `(?:[_a-z]|${nonascii}|${unicode}|${escape2})`;
var nmchar = `(?:[_a-z0-9-]|${nonascii}|${unicode}|${escape2})`;
var name = `(?:${nmchar}+)`;
var ident = `(?:[-]?${nmstart}${nmchar}*)`;
var string1 = `'([^\\n\\r\\f\\\\']|\\\\${nl}|${nonascii}|${unicode}|${escape2})*'`;
var string2 = `"([^\\n\\r\\f\\\\"]|\\\\${nl}|${nonascii}|${unicode}|${escape2})*"`;
var lexSelector = o([
  { name: "ws", regex: new RegExp(ws) },
  { name: "hash", regex: new RegExp(`#${name}`, "i") },
  { name: "ident", regex: new RegExp(ident, "i") },
  { name: "str1", regex: new RegExp(string1, "i") },
  { name: "str2", regex: new RegExp(string2, "i") },
  { name: "*" },
  { name: "." },
  { name: "," },
  { name: "[" },
  { name: "]" },
  { name: "=" },
  { name: ">" },
  { name: "|" },
  { name: "+" },
  { name: "~" },
  { name: "^" },
  { name: "$" }
]);
var lexEscapedString = o([
  { name: "unicode", regex: new RegExp(unicode, "i") },
  { name: "escape", regex: new RegExp(escape2, "i") },
  { name: "any", regex: new RegExp("[\\s\\S]", "i") }
]);
function sumSpec([a0, a1, a2], [b0, b1, b2]) {
  return [a0 + b0, a1 + b1, a2 + b2];
}
function sumAllSpec(ss) {
  return ss.reduce(sumSpec, [0, 0, 0]);
}
var unicodeEscapedSequence_ = token((t2) => t2.name === "unicode" ? String.fromCodePoint(parseInt(t2.text.slice(1), 16)) : undefined);
var escapedSequence_ = token((t2) => t2.name === "escape" ? t2.text.slice(1) : undefined);
var anyChar_ = token((t2) => t2.name === "any" ? t2.text : undefined);
var escapedString_ = map(many(choice(unicodeEscapedSequence_, escapedSequence_, anyChar_)), (cs) => cs.join(""));
function unescape2(escapedString) {
  const lexerResult = lexEscapedString(escapedString);
  const result = escapedString_({ tokens: lexerResult.tokens, options: undefined }, 0);
  return result.value;
}
function literal(name2) {
  return token((t2) => t2.name === name2 ? true : undefined);
}
var whitespace_ = token((t2) => t2.name === "ws" ? null : undefined);
var optionalWhitespace_ = option(whitespace_, null);
function optionallySpaced(parser) {
  return middle(optionalWhitespace_, parser, optionalWhitespace_);
}
var identifier_ = token((t2) => t2.name === "ident" ? unescape2(t2.text) : undefined);
var hashId_ = token((t2) => t2.name === "hash" ? unescape2(t2.text.slice(1)) : undefined);
var string_ = token((t2) => t2.name.startsWith("str") ? unescape2(t2.text.slice(1, -1)) : undefined);
var namespace_ = left(option(identifier_, ""), literal("|"));
var qualifiedName_ = otherwise(ab(namespace_, identifier_, (ns, name2) => ({ name: name2, namespace: ns })), map(identifier_, (name2) => ({ name: name2, namespace: null })));
var uniSelector_ = otherwise(ab(namespace_, literal("*"), (ns) => ({ type: "universal", namespace: ns, specificity: [0, 0, 0] })), map(literal("*"), () => ({ type: "universal", namespace: null, specificity: [0, 0, 0] })));
var tagSelector_ = map(qualifiedName_, ({ name: name2, namespace }) => ({
  type: "tag",
  name: name2,
  namespace,
  specificity: [0, 0, 1]
}));
var classSelector_ = ab(literal("."), identifier_, (fullstop, name2) => ({
  type: "class",
  name: name2,
  specificity: [0, 1, 0]
}));
var idSelector_ = map(hashId_, (name2) => ({
  type: "id",
  name: name2,
  specificity: [1, 0, 0]
}));
var attrModifier_ = token((t2) => {
  if (t2.name === "ident") {
    if (t2.text === "i" || t2.text === "I") {
      return "i";
    }
    if (t2.text === "s" || t2.text === "S") {
      return "s";
    }
  }
  return;
});
var attrValue_ = otherwise(ab(string_, option(right(optionalWhitespace_, attrModifier_), null), (v, mod) => ({ value: v, modifier: mod })), ab(identifier_, option(right(whitespace_, attrModifier_), null), (v, mod) => ({ value: v, modifier: mod })));
var attrMatcher_ = choice(map(literal("="), () => "="), ab(literal("~"), literal("="), () => "~="), ab(literal("|"), literal("="), () => "|="), ab(literal("^"), literal("="), () => "^="), ab(literal("$"), literal("="), () => "$="), ab(literal("*"), literal("="), () => "*="));
var attrPresenceSelector_ = abc(literal("["), optionallySpaced(qualifiedName_), literal("]"), (lbr, { name: name2, namespace }) => ({
  type: "attrPresence",
  name: name2,
  namespace,
  specificity: [0, 1, 0]
}));
var attrValueSelector_ = middle(literal("["), abc(optionallySpaced(qualifiedName_), attrMatcher_, optionallySpaced(attrValue_), ({ name: name2, namespace }, matcher, { value, modifier }) => ({
  type: "attrValue",
  name: name2,
  namespace,
  matcher,
  value,
  modifier,
  specificity: [0, 1, 0]
})), literal("]"));
var attrSelector_ = otherwise(attrPresenceSelector_, attrValueSelector_);
var typeSelector_ = otherwise(uniSelector_, tagSelector_);
var subclassSelector_ = choice(idSelector_, classSelector_, attrSelector_);
var compoundSelector_ = map(otherwise(flatten(typeSelector_, many(subclassSelector_)), many1(subclassSelector_)), (ss) => {
  return {
    type: "compound",
    list: ss,
    specificity: sumAllSpec(ss.map((s2) => s2.specificity))
  };
});
var combinator_ = choice(map(literal(">"), () => ">"), map(literal("+"), () => "+"), map(literal("~"), () => "~"), ab(literal("|"), literal("|"), () => "||"));
var combinatorSeparator_ = otherwise(optionallySpaced(combinator_), map(whitespace_, () => " "));
var complexSelector_ = leftAssoc2(compoundSelector_, map(combinatorSeparator_, (c2) => (left2, right2) => ({
  type: "compound",
  list: [...right2.list, { type: "combinator", combinator: c2, left: left2, specificity: left2.specificity }],
  specificity: sumSpec(left2.specificity, right2.specificity)
})), compoundSelector_);
var listSelector_ = leftAssoc2(map(complexSelector_, (s2) => ({ type: "list", list: [s2] })), map(optionallySpaced(literal(",")), () => (acc, next) => ({ type: "list", list: [...acc.list, next] })), complexSelector_);
function parse_(parser, str) {
  if (!(typeof str === "string" || str instanceof String)) {
    throw new Error("Expected a selector string. Actual input is not a string!");
  }
  const lexerResult = lexSelector(str);
  if (!lexerResult.complete) {
    throw new Error(`The input "${str}" was only partially tokenized, stopped at offset ${lexerResult.offset}!
` + prettyPrintPosition(str, lexerResult.offset));
  }
  const result = optionallySpaced(parser)({ tokens: lexerResult.tokens, options: undefined }, 0);
  if (!result.matched) {
    throw new Error(`No match for "${str}" input!`);
  }
  if (result.position < lexerResult.tokens.length) {
    const token2 = lexerResult.tokens[result.position];
    throw new Error(`The input "${str}" was only partially parsed, stopped at offset ${token2.offset}!
` + prettyPrintPosition(str, token2.offset, token2.len));
  }
  return result.value;
}
function prettyPrintPosition(str, offset, len = 1) {
  return `${str.replace(/(\t)|(\r)|(\n)/g, (m, t2, r2) => t2 ? "␉" : r2 ? "␍" : "␊")}
${"".padEnd(offset)}${"^".repeat(len)}`;
}
function parse1(str) {
  return parse_(complexSelector_, str);
}
function serialize(selector) {
  if (!selector.type) {
    throw new Error("This is not an AST node.");
  }
  switch (selector.type) {
    case "universal":
      return _serNs(selector.namespace) + "*";
    case "tag":
      return _serNs(selector.namespace) + _serIdent(selector.name);
    case "class":
      return "." + _serIdent(selector.name);
    case "id":
      return "#" + _serIdent(selector.name);
    case "attrPresence":
      return `[${_serNs(selector.namespace)}${_serIdent(selector.name)}]`;
    case "attrValue":
      return `[${_serNs(selector.namespace)}${_serIdent(selector.name)}${selector.matcher}"${_serStr(selector.value)}"${selector.modifier ? selector.modifier : ""}]`;
    case "combinator":
      return serialize(selector.left) + selector.combinator;
    case "compound":
      return selector.list.reduce((acc, node2) => {
        if (node2.type === "combinator") {
          return serialize(node2) + acc;
        } else {
          return acc + serialize(node2);
        }
      }, "");
    case "list":
      return selector.list.map(serialize).join(",");
  }
}
function _serNs(ns) {
  return ns || ns === "" ? _serIdent(ns) + "|" : "";
}
function _codePoint(char) {
  return `\\${char.codePointAt(0).toString(16)} `;
}
function _serIdent(str) {
  return str.replace(/(^[0-9])|(^-[0-9])|(^-$)|([-0-9a-zA-Z_]|[^\x00-\x7F])|(\x00)|([\x01-\x1f]|\x7f)|([\s\S])/g, (m, d1, d2, hy, safe, nl2, ctrl, other) => d1 ? _codePoint(d1) : d2 ? "-" + _codePoint(d2.slice(1)) : hy ? "\\-" : safe ? safe : nl2 ? "�" : ctrl ? _codePoint(ctrl) : "\\" + other);
}
function _serStr(str) {
  return str.replace(/(")|(\\)|(\x00)|([\x01-\x1f]|\x7f)/g, (m, dq, bs, nl2, ctrl) => dq ? "\\\"" : bs ? "\\\\" : nl2 ? "�" : _codePoint(ctrl));
}
function normalize(selector) {
  if (!selector.type) {
    throw new Error("This is not an AST node.");
  }
  switch (selector.type) {
    case "compound": {
      selector.list.forEach(normalize);
      selector.list.sort((a, b) => _compareArrays(_getSelectorPriority(a), _getSelectorPriority(b)));
      break;
    }
    case "combinator": {
      normalize(selector.left);
      break;
    }
    case "list": {
      selector.list.forEach(normalize);
      selector.list.sort((a, b) => serialize(a) < serialize(b) ? -1 : 1);
      break;
    }
  }
  return selector;
}
function _getSelectorPriority(selector) {
  switch (selector.type) {
    case "universal":
      return [1];
    case "tag":
      return [1];
    case "id":
      return [2];
    case "class":
      return [3, selector.name];
    case "attrPresence":
      return [4, serialize(selector)];
    case "attrValue":
      return [5, serialize(selector)];
    case "combinator":
      return [15, serialize(selector)];
  }
}
function compareSpecificity(a, b) {
  return _compareArrays(a, b);
}
function _compareArrays(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new Error("Arguments must be arrays.");
  }
  const shorter = a.length < b.length ? a.length : b.length;
  for (let i = 0;i < shorter; i++) {
    if (a[i] === b[i]) {
      continue;
    }
    return a[i] < b[i] ? -1 : 1;
  }
  return a.length - b.length;
}

// node_modules/selderee/lib/selderee.mjs
class DecisionTree {
  constructor(input) {
    this.branches = weave(toAstTerminalPairs(input));
  }
  build(builder) {
    return builder(this.branches);
  }
}
function toAstTerminalPairs(array) {
  const len = array.length;
  const results = new Array(len);
  for (let i = 0;i < len; i++) {
    const [selectorString, val] = array[i];
    const ast = preprocess(parse1(selectorString));
    results[i] = {
      ast,
      terminal: {
        type: "terminal",
        valueContainer: { index: i, value: val, specificity: ast.specificity }
      }
    };
  }
  return results;
}
function preprocess(ast) {
  reduceSelectorVariants(ast);
  normalize(ast);
  return ast;
}
function reduceSelectorVariants(ast) {
  const newList = [];
  ast.list.forEach((sel) => {
    switch (sel.type) {
      case "class":
        newList.push({
          matcher: "~=",
          modifier: null,
          name: "class",
          namespace: null,
          specificity: sel.specificity,
          type: "attrValue",
          value: sel.name
        });
        break;
      case "id":
        newList.push({
          matcher: "=",
          modifier: null,
          name: "id",
          namespace: null,
          specificity: sel.specificity,
          type: "attrValue",
          value: sel.name
        });
        break;
      case "combinator":
        reduceSelectorVariants(sel.left);
        newList.push(sel);
        break;
      case "universal":
        break;
      default:
        newList.push(sel);
        break;
    }
  });
  ast.list = newList;
}
function weave(items) {
  const branches = [];
  while (items.length) {
    const topKind = findTopKey(items, (sel) => true, getSelectorKind);
    const { matches, nonmatches, empty } = breakByKind(items, topKind);
    items = nonmatches;
    if (matches.length) {
      branches.push(branchOfKind(topKind, matches));
    }
    if (empty.length) {
      branches.push(...terminate(empty));
    }
  }
  return branches;
}
function terminate(items) {
  const results = [];
  for (const item of items) {
    const terminal = item.terminal;
    if (terminal.type === "terminal") {
      results.push(terminal);
    } else {
      const { matches, rest } = partition(terminal.cont, (node2) => node2.type === "terminal");
      matches.forEach((node2) => results.push(node2));
      if (rest.length) {
        terminal.cont = rest;
        results.push(terminal);
      }
    }
  }
  return results;
}
function breakByKind(items, selectedKind) {
  const matches = [];
  const nonmatches = [];
  const empty = [];
  for (const item of items) {
    const simpsels = item.ast.list;
    if (simpsels.length) {
      const isMatch = simpsels.some((node2) => getSelectorKind(node2) === selectedKind);
      (isMatch ? matches : nonmatches).push(item);
    } else {
      empty.push(item);
    }
  }
  return { matches, nonmatches, empty };
}
function getSelectorKind(sel) {
  switch (sel.type) {
    case "attrPresence":
      return `attrPresence ${sel.name}`;
    case "attrValue":
      return `attrValue ${sel.name}`;
    case "combinator":
      return `combinator ${sel.combinator}`;
    default:
      return sel.type;
  }
}
function branchOfKind(kind, items) {
  if (kind === "tag") {
    return tagNameBranch(items);
  }
  if (kind.startsWith("attrValue ")) {
    return attrValueBranch(kind.substring(10), items);
  }
  if (kind.startsWith("attrPresence ")) {
    return attrPresenceBranch(kind.substring(13), items);
  }
  if (kind === "combinator >") {
    return combinatorBranch(">", items);
  }
  if (kind === "combinator +") {
    return combinatorBranch("+", items);
  }
  throw new Error(`Unsupported selector kind: ${kind}`);
}
function tagNameBranch(items) {
  const groups = spliceAndGroup(items, (x) => x.type === "tag", (x) => x.name);
  const variants = Object.entries(groups).map(([name2, group]) => ({
    type: "variant",
    value: name2,
    cont: weave(group.items)
  }));
  return {
    type: "tagName",
    variants
  };
}
function attrPresenceBranch(name2, items) {
  for (const item of items) {
    spliceSimpleSelector(item, (x) => x.type === "attrPresence" && x.name === name2);
  }
  return {
    type: "attrPresence",
    name: name2,
    cont: weave(items)
  };
}
function attrValueBranch(name2, items) {
  const groups = spliceAndGroup(items, (x) => x.type === "attrValue" && x.name === name2, (x) => `${x.matcher} ${x.modifier || ""} ${x.value}`);
  const matchers = [];
  for (const group of Object.values(groups)) {
    const sel = group.oneSimpleSelector;
    const predicate = getAttrPredicate(sel);
    const continuation = weave(group.items);
    matchers.push({
      type: "matcher",
      matcher: sel.matcher,
      modifier: sel.modifier,
      value: sel.value,
      predicate,
      cont: continuation
    });
  }
  return {
    type: "attrValue",
    name: name2,
    matchers
  };
}
function getAttrPredicate(sel) {
  if (sel.modifier === "i") {
    const expected = sel.value.toLowerCase();
    switch (sel.matcher) {
      case "=":
        return (actual) => expected === actual.toLowerCase();
      case "~=":
        return (actual) => actual.toLowerCase().split(/[ \t]+/).includes(expected);
      case "^=":
        return (actual) => actual.toLowerCase().startsWith(expected);
      case "$=":
        return (actual) => actual.toLowerCase().endsWith(expected);
      case "*=":
        return (actual) => actual.toLowerCase().includes(expected);
      case "|=":
        return (actual) => {
          const lower = actual.toLowerCase();
          return expected === lower || lower.startsWith(expected) && lower[expected.length] === "-";
        };
    }
  } else {
    const expected = sel.value;
    switch (sel.matcher) {
      case "=":
        return (actual) => expected === actual;
      case "~=":
        return (actual) => actual.split(/[ \t]+/).includes(expected);
      case "^=":
        return (actual) => actual.startsWith(expected);
      case "$=":
        return (actual) => actual.endsWith(expected);
      case "*=":
        return (actual) => actual.includes(expected);
      case "|=":
        return (actual) => expected === actual || actual.startsWith(expected) && actual[expected.length] === "-";
    }
  }
}
function combinatorBranch(combinator, items) {
  const groups = spliceAndGroup(items, (x) => x.type === "combinator" && x.combinator === combinator, (x) => serialize(x.left));
  const leftItems = [];
  for (const group of Object.values(groups)) {
    const rightCont = weave(group.items);
    const leftAst = group.oneSimpleSelector.left;
    leftItems.push({
      ast: leftAst,
      terminal: { type: "popElement", cont: rightCont }
    });
  }
  return {
    type: "pushElement",
    combinator,
    cont: weave(leftItems)
  };
}
function spliceAndGroup(items, predicate, keyCallback) {
  const groups = {};
  while (items.length) {
    const bestKey = findTopKey(items, predicate, keyCallback);
    const bestKeyPredicate = (sel) => predicate(sel) && keyCallback(sel) === bestKey;
    const hasBestKeyPredicate = (item) => item.ast.list.some(bestKeyPredicate);
    const { matches, rest } = partition1(items, hasBestKeyPredicate);
    let oneSimpleSelector = null;
    for (const item of matches) {
      const splicedNode = spliceSimpleSelector(item, bestKeyPredicate);
      if (!oneSimpleSelector) {
        oneSimpleSelector = splicedNode;
      }
    }
    if (oneSimpleSelector == null) {
      throw new Error("No simple selector is found.");
    }
    groups[bestKey] = { oneSimpleSelector, items: matches };
    items = rest;
  }
  return groups;
}
function spliceSimpleSelector(item, predicate) {
  const simpsels = item.ast.list;
  const matches = new Array(simpsels.length);
  let firstIndex = -1;
  for (let i = simpsels.length;i-- > 0; ) {
    if (predicate(simpsels[i])) {
      matches[i] = true;
      firstIndex = i;
    }
  }
  if (firstIndex == -1) {
    throw new Error(`Couldn't find the required simple selector.`);
  }
  const result = simpsels[firstIndex];
  item.ast.list = simpsels.filter((sel, i) => !matches[i]);
  return result;
}
function findTopKey(items, predicate, keyCallback) {
  const candidates = {};
  for (const item of items) {
    const candidates1 = {};
    for (const node2 of item.ast.list.filter(predicate)) {
      candidates1[keyCallback(node2)] = true;
    }
    for (const key of Object.keys(candidates1)) {
      if (candidates[key]) {
        candidates[key]++;
      } else {
        candidates[key] = 1;
      }
    }
  }
  let topKind = "";
  let topCounter = 0;
  for (const entry of Object.entries(candidates)) {
    if (entry[1] > topCounter) {
      topKind = entry[0];
      topCounter = entry[1];
    }
  }
  return topKind;
}
function partition(src, predicate) {
  const matches = [];
  const rest = [];
  for (const x of src) {
    if (predicate(x)) {
      matches.push(x);
    } else {
      rest.push(x);
    }
  }
  return { matches, rest };
}
function partition1(src, predicate) {
  const matches = [];
  const rest = [];
  for (const x of src) {
    if (predicate(x)) {
      matches.push(x);
    } else {
      rest.push(x);
    }
  }
  return { matches, rest };
}

class Picker {
  constructor(f) {
    this.f = f;
  }
  pickAll(el) {
    return this.f(el);
  }
  pick1(el, preferFirst = false) {
    const results = this.f(el);
    const len = results.length;
    if (len === 0) {
      return null;
    }
    if (len === 1) {
      return results[0].value;
    }
    const comparator = preferFirst ? comparatorPreferFirst : comparatorPreferLast;
    let result = results[0];
    for (let i = 1;i < len; i++) {
      const next = results[i];
      if (comparator(result, next)) {
        result = next;
      }
    }
    return result.value;
  }
}
function comparatorPreferFirst(acc, next) {
  const diff = compareSpecificity(next.specificity, acc.specificity);
  return diff > 0 || diff === 0 && next.index < acc.index;
}
function comparatorPreferLast(acc, next) {
  const diff = compareSpecificity(next.specificity, acc.specificity);
  return diff > 0 || diff === 0 && next.index > acc.index;
}

// node_modules/@selderee/plugin-htmlparser2/lib/hp2-builder.mjs
function hp2Builder(nodes) {
  return new Picker(handleArray(nodes));
}
function handleArray(nodes) {
  const matchers = nodes.map(handleNode);
  return (el, ...tail) => matchers.flatMap((m) => m(el, ...tail));
}
function handleNode(node2) {
  switch (node2.type) {
    case "terminal": {
      const result = [node2.valueContainer];
      return (el, ...tail) => result;
    }
    case "tagName":
      return handleTagName(node2);
    case "attrValue":
      return handleAttrValueName(node2);
    case "attrPresence":
      return handleAttrPresenceName(node2);
    case "pushElement":
      return handlePushElementNode(node2);
    case "popElement":
      return handlePopElementNode(node2);
  }
}
function handleTagName(node2) {
  const variants = {};
  for (const variant of node2.variants) {
    variants[variant.value] = handleArray(variant.cont);
  }
  return (el, ...tail) => {
    const continuation = variants[el.name];
    return continuation ? continuation(el, ...tail) : [];
  };
}
function handleAttrPresenceName(node2) {
  const attrName = node2.name;
  const continuation = handleArray(node2.cont);
  return (el, ...tail) => Object.prototype.hasOwnProperty.call(el.attribs, attrName) ? continuation(el, ...tail) : [];
}
function handleAttrValueName(node2) {
  const callbacks = [];
  for (const matcher of node2.matchers) {
    const predicate = matcher.predicate;
    const continuation = handleArray(matcher.cont);
    callbacks.push((attr, el, ...tail) => predicate(attr) ? continuation(el, ...tail) : []);
  }
  const attrName = node2.name;
  return (el, ...tail) => {
    const attr = el.attribs[attrName];
    return attr || attr === "" ? callbacks.flatMap((cb) => cb(attr, el, ...tail)) : [];
  };
}
function handlePushElementNode(node2) {
  const continuation = handleArray(node2.cont);
  const leftElementGetter = node2.combinator === "+" ? getPrecedingElement : getParentElement;
  return (el, ...tail) => {
    const next = leftElementGetter(el);
    if (next === null) {
      return [];
    }
    return continuation(next, el, ...tail);
  };
}
var getPrecedingElement = (el) => {
  const prev = el.prev;
  if (prev === null) {
    return null;
  }
  return isTag2(prev) ? prev : getPrecedingElement(prev);
};
var getParentElement = (el) => {
  const parent = el.parent;
  return parent && isTag2(parent) ? parent : null;
};
function handlePopElementNode(node2) {
  const continuation = handleArray(node2.cont);
  return (el, next, ...tail) => continuation(next, ...tail);
}

// node_modules/entities/lib/esm/generated/decode-data-html.js
var decode_data_html_default = new Uint16Array("ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\x00\x00\x00\x00\x00\x00ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀\uD835\uDD04rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀\uD835\uDD38plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀\uD835\uDC9Cign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀\uD835\uDD05pf;쀀\uD835\uDD39eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀\uD835\uDC9EpĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀\uD835\uDD07Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\x00\x00\x00͔͂\x00Ѕf;쀀\uD835\uDD3Bƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\x00\x00ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\x00\x00ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\x00ц\x00ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\x00ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀\uD835\uDC9Frok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀\uD835\uDD08rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\x00\x00ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀\uD835\uDD3Csilon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀\uD835\uDD09lledɓ֗\x00\x00֣mallSquare;旼erySmallSquare;斪Ͱֺ\x00ֿ\x00\x00ׄf;쀀\uD835\uDD3DAll;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀\uD835\uDD0A;拙pf;쀀\uD835\uDD3Eeater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀\uD835\uDCA2;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\x00ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\x00ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀\uD835\uDD40a;䎙cr;愐ilde;䄨ǫޚ\x00ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀\uD835\uDD0Dpf;쀀\uD835\uDD41ǣ߇\x00ߌr;쀀\uD835\uDCA5rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀\uD835\uDD0Epf;쀀\uD835\uDD42cr;쀀\uD835\uDCA6րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\x00ࣃbleBracket;柦nǔࣈ\x00࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀\uD835\uDD0FĀ;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀\uD835\uDD43erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀\uD835\uDD10nusPlus;戓pf;쀀\uD835\uDD44cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀\uD835\uDD11ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀\uD835\uDCA9ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀\uD835\uDD12rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀\uD835\uDD46enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀\uD835\uDCAAash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀\uD835\uDD13i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀\uD835\uDCAB;䎨ȀUfos༑༖༛༟OT耻\"䀢r;쀀\uD835\uDD14pf;愚cr;쀀\uD835\uDCAC؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\x00စbleBracket;柧nǔည\x00နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀\uD835\uDD16ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀\uD835\uDD4Aɲᅭ\x00\x00ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀\uD835\uDCAEar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀\uD835\uDD17Āeiቻ኉ǲኀ\x00ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀\uD835\uDD4BipleDot;惛Āctዖዛr;쀀\uD835\uDCAFrok;䅦ૡዷጎጚጦ\x00ጬጱ\x00\x00\x00\x00\x00ጸጽ፷ᎅ\x00᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\x00጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀\uD835\uDD18rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀\uD835\uDD4CЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀\uD835\uDCB0ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀\uD835\uDD19pf;쀀\uD835\uDD4Dcr;쀀\uD835\uDCB1dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀\uD835\uDD1Apf;쀀\uD835\uDD4Ecr;쀀\uD835\uDCB2Ȁfiosᓋᓐᓒᓘr;쀀\uD835\uDD1B;䎞pf;쀀\uD835\uDD4Fcr;쀀\uD835\uDCB3ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀\uD835\uDD1Cpf;쀀\uD835\uDD50cr;쀀\uD835\uDCB4ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\x00ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀\uD835\uDCB5௡ᖃᖊᖐ\x00ᖰᖶᖿ\x00\x00\x00\x00ᗆᗛᗫᙟ᙭\x00ᚕ᚛ᚲᚹ\x00ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀\uD835\uDD1Erave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\x00\x00ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀\uD835\uDD52΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀\uD835\uDCB6;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀\uD835\uDD1Fg΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\x00\x00ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\x00ᠳƲᠯ\x00ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀\uD835\uDD53Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀\uD835\uDCB7mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\x00᧨ᨑᨕᨲ\x00ᨷᩐ\x00\x00᪴\x00\x00᫁\x00\x00ᬡᬮ᭍᭒\x00᯽\x00ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\x00᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀\uD835\uDD20ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\x00\x00᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\x00ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\x00\x00᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\x00ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀\uD835\uDD54oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀\uD835\uDCB8Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\x00\x00᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\x00\x00ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀\uD835\uDD21arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\x00\x00ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀\uD835\uDD55ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\x00\x00ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀\uD835\uDCB9;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀\uD835\uDD22ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀\uD835\uDD56ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\x00\x00ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\x00ᾞ\x00ᾡᾧ\x00\x00ῆῌ\x00ΐ\x00ῦῪ \x00 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\x00\x00᾽g;耀ﬀig;耀ﬄ;쀀\uD835\uDD23lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\x00ῳf;쀀\uD835\uDD57ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\x00⁐β•‥‧‪‬\x00‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\x00‶;慔;慖ʴ‾⁁\x00\x00⁃耻¾䂾;慗;慜5;慘ƶ⁌\x00⁎;慚;慝8;慞l;恄wn;挢cr;쀀\uD835\uDCBBࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀\uD835\uDD24Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀\uD835\uDD58Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\x00↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀\uD835\uDD25sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀\uD835\uDD59bar;怕ƀclt≯≴≸r;쀀\uD835\uDCBDasè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\x00⊪\x00⊸⋅⋎\x00⋕⋳\x00\x00⋸⌢⍧⍢⍿\x00⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀\uD835\uDD26rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀\uD835\uDD5Aa;䎹uest耻¿䂿Āci⎊⎏r;쀀\uD835\uDCBEnʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\x00⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀\uD835\uDD27ath;䈷pf;쀀\uD835\uDD5Bǣ⏬\x00⏱r;쀀\uD835\uDCBFrcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀\uD835\uDD28reen;䄸cy;䑅cy;䑜pf;쀀\uD835\uDD5Ccr;쀀\uD835\uDCC0஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\x00⒪\x00⒱\x00\x00\x00\x00\x00⒵Ⓔ\x00ⓆⓈⓍ\x00⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀\uD835\uDD29Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀\uD835\uDD5Dus;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀\uD835\uDCC1mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀\uD835\uDD2Ao;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀\uD835\uDD5EĀct⣸⣽r;쀀\uD835\uDCC2pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\x00⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\x00⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀\uD835\uDD2BȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀\uD835\uDD5F膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀\uD835\uDCC3ortɭ⬅\x00\x00⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00ⴭ\x00ⴸⵈⵠⵥ⵲ⶄᬇ\x00\x00ⶍⶫ\x00ⷈⷎ\x00ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀\uD835\uDD2Cͯ⵹\x00\x00⵼\x00ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀\uD835\uDD60ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\x00⹽\x00⺀⺝\x00⺢⺹\x00\x00⻋ຜ\x00⼓\x00\x00⼫⾼\x00⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\x00\x00⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀\uD835\uDD2Dƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀\uD835\uDD61nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀\uD835\uDCC5;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀\uD835\uDD2Epf;쀀\uD835\uDD62rime;恗cr;쀀\uD835\uDCC6ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀\uD835\uDD2FĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀\uD835\uDD63us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀\uD835\uDCC7Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\x00㍺㎤\x00\x00㏬㏰\x00㐨㑈㑚㒭㒱㓊㓱\x00㘖\x00\x00㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\x00㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀\uD835\uDD30Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\x00\x00㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀\uD835\uDD64aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀\uD835\uDCC8tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\x00㙾㛂\x00\x00\x00\x00\x00㛛㜃\x00㜉㝬\x00\x00\x00㞇ɲ㙖\x00\x00㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀\uD835\uDD31Ȁeiko㚆㚝㚵㚼ǲ㚋\x00㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀\uD835\uDD65rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀\uD835\uDCC9;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\x00㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀\uD835\uDD32rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\x00\x00㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀\uD835\uDD66̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\x00\x00㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀\uD835\uDCCAƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀\uD835\uDD33tré㦮suĀbp㧯㧱»ജ»൙pf;쀀\uD835\uDD67roð໻tré㦴Ācu㨆㨋r;쀀\uD835\uDCCBĀbp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀\uD835\uDD34pf;쀀\uD835\uDD68Ā;eᑹ㩦atèᑹcr;쀀\uD835\uDCCCૣណ㪇\x00㪋\x00㪐㪛\x00\x00㪝㪨㪫㪯\x00\x00㫃㫎\x00㫘ៜ៟tré៑r;쀀\uD835\uDD35ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀\uD835\uDD69imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀\uD835\uDCCDĀpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀\uD835\uDD36cy;䑗pf;쀀\uD835\uDD6Acr;쀀\uD835\uDCCEĀcm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀\uD835\uDD37cy;䐶grarr;懝pf;쀀\uD835\uDD6Bcr;쀀\uD835\uDCCFĀjn㮅㮇;怍j;怌".split("").map((c2) => c2.charCodeAt(0)));

// node_modules/entities/lib/esm/generated/decode-data-xml.js
var decode_data_xml_default = new Uint16Array("Ȁaglq\t\x15\x18\x1Bɭ\x0F\x00\x00\x12p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map((c2) => c2.charCodeAt(0)));

// node_modules/entities/lib/esm/decode_codepoint.js
var _a;
var decodeMap = new Map([
  [0, 65533],
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376]
]);
var fromCodePoint = (_a = String.fromCodePoint) !== null && _a !== undefined ? _a : function(codePoint) {
  let output = "";
  if (codePoint > 65535) {
    codePoint -= 65536;
    output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
    codePoint = 56320 | codePoint & 1023;
  }
  output += String.fromCharCode(codePoint);
  return output;
};
function replaceCodePoint(codePoint) {
  var _a2;
  if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
    return 65533;
  }
  return (_a2 = decodeMap.get(codePoint)) !== null && _a2 !== undefined ? _a2 : codePoint;
}
// node_modules/entities/lib/esm/decode.js
var CharCodes;
(function(CharCodes2) {
  CharCodes2[CharCodes2["NUM"] = 35] = "NUM";
  CharCodes2[CharCodes2["SEMI"] = 59] = "SEMI";
  CharCodes2[CharCodes2["EQUALS"] = 61] = "EQUALS";
  CharCodes2[CharCodes2["ZERO"] = 48] = "ZERO";
  CharCodes2[CharCodes2["NINE"] = 57] = "NINE";
  CharCodes2[CharCodes2["LOWER_A"] = 97] = "LOWER_A";
  CharCodes2[CharCodes2["LOWER_F"] = 102] = "LOWER_F";
  CharCodes2[CharCodes2["LOWER_X"] = 120] = "LOWER_X";
  CharCodes2[CharCodes2["LOWER_Z"] = 122] = "LOWER_Z";
  CharCodes2[CharCodes2["UPPER_A"] = 65] = "UPPER_A";
  CharCodes2[CharCodes2["UPPER_F"] = 70] = "UPPER_F";
  CharCodes2[CharCodes2["UPPER_Z"] = 90] = "UPPER_Z";
})(CharCodes || (CharCodes = {}));
var TO_LOWER_BIT = 32;
var BinTrieFlags;
(function(BinTrieFlags2) {
  BinTrieFlags2[BinTrieFlags2["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
  BinTrieFlags2[BinTrieFlags2["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
  BinTrieFlags2[BinTrieFlags2["JUMP_TABLE"] = 127] = "JUMP_TABLE";
})(BinTrieFlags || (BinTrieFlags = {}));
function isNumber(code) {
  return code >= CharCodes.ZERO && code <= CharCodes.NINE;
}
function isHexadecimalCharacter(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F;
}
function isAsciiAlphaNumeric(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z || isNumber(code);
}
function isEntityInAttributeInvalidEnd(code) {
  return code === CharCodes.EQUALS || isAsciiAlphaNumeric(code);
}
var EntityDecoderState;
(function(EntityDecoderState2) {
  EntityDecoderState2[EntityDecoderState2["EntityStart"] = 0] = "EntityStart";
  EntityDecoderState2[EntityDecoderState2["NumericStart"] = 1] = "NumericStart";
  EntityDecoderState2[EntityDecoderState2["NumericDecimal"] = 2] = "NumericDecimal";
  EntityDecoderState2[EntityDecoderState2["NumericHex"] = 3] = "NumericHex";
  EntityDecoderState2[EntityDecoderState2["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function(DecodingMode2) {
  DecodingMode2[DecodingMode2["Legacy"] = 0] = "Legacy";
  DecodingMode2[DecodingMode2["Strict"] = 1] = "Strict";
  DecodingMode2[DecodingMode2["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));

class EntityDecoder {
  constructor(decodeTree, emitCodePoint, errors) {
    this.decodeTree = decodeTree;
    this.emitCodePoint = emitCodePoint;
    this.errors = errors;
    this.state = EntityDecoderState.EntityStart;
    this.consumed = 1;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.decodeMode = DecodingMode.Strict;
  }
  startEntity(decodeMode) {
    this.decodeMode = decodeMode;
    this.state = EntityDecoderState.EntityStart;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.consumed = 1;
  }
  write(str, offset) {
    switch (this.state) {
      case EntityDecoderState.EntityStart: {
        if (str.charCodeAt(offset) === CharCodes.NUM) {
          this.state = EntityDecoderState.NumericStart;
          this.consumed += 1;
          return this.stateNumericStart(str, offset + 1);
        }
        this.state = EntityDecoderState.NamedEntity;
        return this.stateNamedEntity(str, offset);
      }
      case EntityDecoderState.NumericStart: {
        return this.stateNumericStart(str, offset);
      }
      case EntityDecoderState.NumericDecimal: {
        return this.stateNumericDecimal(str, offset);
      }
      case EntityDecoderState.NumericHex: {
        return this.stateNumericHex(str, offset);
      }
      case EntityDecoderState.NamedEntity: {
        return this.stateNamedEntity(str, offset);
      }
    }
  }
  stateNumericStart(str, offset) {
    if (offset >= str.length) {
      return -1;
    }
    if ((str.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
      this.state = EntityDecoderState.NumericHex;
      this.consumed += 1;
      return this.stateNumericHex(str, offset + 1);
    }
    this.state = EntityDecoderState.NumericDecimal;
    return this.stateNumericDecimal(str, offset);
  }
  addToNumericResult(str, start, end, base) {
    if (start !== end) {
      const digitCount = end - start;
      this.result = this.result * Math.pow(base, digitCount) + parseInt(str.substr(start, digitCount), base);
      this.consumed += digitCount;
    }
  }
  stateNumericHex(str, offset) {
    const startIdx = offset;
    while (offset < str.length) {
      const char = str.charCodeAt(offset);
      if (isNumber(char) || isHexadecimalCharacter(char)) {
        offset += 1;
      } else {
        this.addToNumericResult(str, startIdx, offset, 16);
        return this.emitNumericEntity(char, 3);
      }
    }
    this.addToNumericResult(str, startIdx, offset, 16);
    return -1;
  }
  stateNumericDecimal(str, offset) {
    const startIdx = offset;
    while (offset < str.length) {
      const char = str.charCodeAt(offset);
      if (isNumber(char)) {
        offset += 1;
      } else {
        this.addToNumericResult(str, startIdx, offset, 10);
        return this.emitNumericEntity(char, 2);
      }
    }
    this.addToNumericResult(str, startIdx, offset, 10);
    return -1;
  }
  emitNumericEntity(lastCp, expectedLength) {
    var _a2;
    if (this.consumed <= expectedLength) {
      (_a2 = this.errors) === null || _a2 === undefined || _a2.absenceOfDigitsInNumericCharacterReference(this.consumed);
      return 0;
    }
    if (lastCp === CharCodes.SEMI) {
      this.consumed += 1;
    } else if (this.decodeMode === DecodingMode.Strict) {
      return 0;
    }
    this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
    if (this.errors) {
      if (lastCp !== CharCodes.SEMI) {
        this.errors.missingSemicolonAfterCharacterReference();
      }
      this.errors.validateNumericCharacterReference(this.result);
    }
    return this.consumed;
  }
  stateNamedEntity(str, offset) {
    const { decodeTree } = this;
    let current = decodeTree[this.treeIndex];
    let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
    for (;offset < str.length; offset++, this.excess++) {
      const char = str.charCodeAt(offset);
      this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
      if (this.treeIndex < 0) {
        return this.result === 0 || this.decodeMode === DecodingMode.Attribute && (valueLength === 0 || isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
      }
      current = decodeTree[this.treeIndex];
      valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
      if (valueLength !== 0) {
        if (char === CharCodes.SEMI) {
          return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
        }
        if (this.decodeMode !== DecodingMode.Strict) {
          this.result = this.treeIndex;
          this.consumed += this.excess;
          this.excess = 0;
        }
      }
    }
    return -1;
  }
  emitNotTerminatedNamedEntity() {
    var _a2;
    const { result, decodeTree } = this;
    const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
    this.emitNamedEntityData(result, valueLength, this.consumed);
    (_a2 = this.errors) === null || _a2 === undefined || _a2.missingSemicolonAfterCharacterReference();
    return this.consumed;
  }
  emitNamedEntityData(result, valueLength, consumed) {
    const { decodeTree } = this;
    this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~BinTrieFlags.VALUE_LENGTH : decodeTree[result + 1], consumed);
    if (valueLength === 3) {
      this.emitCodePoint(decodeTree[result + 2], consumed);
    }
    return consumed;
  }
  end() {
    var _a2;
    switch (this.state) {
      case EntityDecoderState.NamedEntity: {
        return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      }
      case EntityDecoderState.NumericDecimal: {
        return this.emitNumericEntity(0, 2);
      }
      case EntityDecoderState.NumericHex: {
        return this.emitNumericEntity(0, 3);
      }
      case EntityDecoderState.NumericStart: {
        (_a2 = this.errors) === null || _a2 === undefined || _a2.absenceOfDigitsInNumericCharacterReference(this.consumed);
        return 0;
      }
      case EntityDecoderState.EntityStart: {
        return 0;
      }
    }
  }
}
function getDecoder(decodeTree) {
  let ret = "";
  const decoder = new EntityDecoder(decodeTree, (str) => ret += fromCodePoint(str));
  return function decodeWithTrie(str, decodeMode) {
    let lastIndex = 0;
    let offset = 0;
    while ((offset = str.indexOf("&", offset)) >= 0) {
      ret += str.slice(lastIndex, offset);
      decoder.startEntity(decodeMode);
      const len = decoder.write(str, offset + 1);
      if (len < 0) {
        lastIndex = offset + decoder.end();
        break;
      }
      lastIndex = offset + len;
      offset = len === 0 ? lastIndex + 1 : lastIndex;
    }
    const result = ret + str.slice(lastIndex);
    ret = "";
    return result;
  };
}
function determineBranch(decodeTree, current, nodeIdx, char) {
  const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
  const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
  if (branchCount === 0) {
    return jumpOffset !== 0 && char === jumpOffset ? nodeIdx : -1;
  }
  if (jumpOffset) {
    const value = char - jumpOffset;
    return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIdx + value] - 1;
  }
  let lo = nodeIdx;
  let hi = lo + branchCount - 1;
  while (lo <= hi) {
    const mid = lo + hi >>> 1;
    const midVal = decodeTree[mid];
    if (midVal < char) {
      lo = mid + 1;
    } else if (midVal > char) {
      hi = mid - 1;
    } else {
      return decodeTree[mid + branchCount];
    }
  }
  return -1;
}
var htmlDecoder = getDecoder(decode_data_html_default);
var xmlDecoder = getDecoder(decode_data_xml_default);

// node_modules/htmlparser2/lib/esm/Tokenizer.js
var CharCodes2;
(function(CharCodes3) {
  CharCodes3[CharCodes3["Tab"] = 9] = "Tab";
  CharCodes3[CharCodes3["NewLine"] = 10] = "NewLine";
  CharCodes3[CharCodes3["FormFeed"] = 12] = "FormFeed";
  CharCodes3[CharCodes3["CarriageReturn"] = 13] = "CarriageReturn";
  CharCodes3[CharCodes3["Space"] = 32] = "Space";
  CharCodes3[CharCodes3["ExclamationMark"] = 33] = "ExclamationMark";
  CharCodes3[CharCodes3["Number"] = 35] = "Number";
  CharCodes3[CharCodes3["Amp"] = 38] = "Amp";
  CharCodes3[CharCodes3["SingleQuote"] = 39] = "SingleQuote";
  CharCodes3[CharCodes3["DoubleQuote"] = 34] = "DoubleQuote";
  CharCodes3[CharCodes3["Dash"] = 45] = "Dash";
  CharCodes3[CharCodes3["Slash"] = 47] = "Slash";
  CharCodes3[CharCodes3["Zero"] = 48] = "Zero";
  CharCodes3[CharCodes3["Nine"] = 57] = "Nine";
  CharCodes3[CharCodes3["Semi"] = 59] = "Semi";
  CharCodes3[CharCodes3["Lt"] = 60] = "Lt";
  CharCodes3[CharCodes3["Eq"] = 61] = "Eq";
  CharCodes3[CharCodes3["Gt"] = 62] = "Gt";
  CharCodes3[CharCodes3["Questionmark"] = 63] = "Questionmark";
  CharCodes3[CharCodes3["UpperA"] = 65] = "UpperA";
  CharCodes3[CharCodes3["LowerA"] = 97] = "LowerA";
  CharCodes3[CharCodes3["UpperF"] = 70] = "UpperF";
  CharCodes3[CharCodes3["LowerF"] = 102] = "LowerF";
  CharCodes3[CharCodes3["UpperZ"] = 90] = "UpperZ";
  CharCodes3[CharCodes3["LowerZ"] = 122] = "LowerZ";
  CharCodes3[CharCodes3["LowerX"] = 120] = "LowerX";
  CharCodes3[CharCodes3["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
})(CharCodes2 || (CharCodes2 = {}));
var State;
(function(State2) {
  State2[State2["Text"] = 1] = "Text";
  State2[State2["BeforeTagName"] = 2] = "BeforeTagName";
  State2[State2["InTagName"] = 3] = "InTagName";
  State2[State2["InSelfClosingTag"] = 4] = "InSelfClosingTag";
  State2[State2["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
  State2[State2["InClosingTagName"] = 6] = "InClosingTagName";
  State2[State2["AfterClosingTagName"] = 7] = "AfterClosingTagName";
  State2[State2["BeforeAttributeName"] = 8] = "BeforeAttributeName";
  State2[State2["InAttributeName"] = 9] = "InAttributeName";
  State2[State2["AfterAttributeName"] = 10] = "AfterAttributeName";
  State2[State2["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
  State2[State2["InAttributeValueDq"] = 12] = "InAttributeValueDq";
  State2[State2["InAttributeValueSq"] = 13] = "InAttributeValueSq";
  State2[State2["InAttributeValueNq"] = 14] = "InAttributeValueNq";
  State2[State2["BeforeDeclaration"] = 15] = "BeforeDeclaration";
  State2[State2["InDeclaration"] = 16] = "InDeclaration";
  State2[State2["InProcessingInstruction"] = 17] = "InProcessingInstruction";
  State2[State2["BeforeComment"] = 18] = "BeforeComment";
  State2[State2["CDATASequence"] = 19] = "CDATASequence";
  State2[State2["InSpecialComment"] = 20] = "InSpecialComment";
  State2[State2["InCommentLike"] = 21] = "InCommentLike";
  State2[State2["BeforeSpecialS"] = 22] = "BeforeSpecialS";
  State2[State2["SpecialStartSequence"] = 23] = "SpecialStartSequence";
  State2[State2["InSpecialTag"] = 24] = "InSpecialTag";
  State2[State2["BeforeEntity"] = 25] = "BeforeEntity";
  State2[State2["BeforeNumericEntity"] = 26] = "BeforeNumericEntity";
  State2[State2["InNamedEntity"] = 27] = "InNamedEntity";
  State2[State2["InNumericEntity"] = 28] = "InNumericEntity";
  State2[State2["InHexEntity"] = 29] = "InHexEntity";
})(State || (State = {}));
function isWhitespace(c2) {
  return c2 === CharCodes2.Space || c2 === CharCodes2.NewLine || c2 === CharCodes2.Tab || c2 === CharCodes2.FormFeed || c2 === CharCodes2.CarriageReturn;
}
function isEndOfTagSection(c2) {
  return c2 === CharCodes2.Slash || c2 === CharCodes2.Gt || isWhitespace(c2);
}
function isNumber2(c2) {
  return c2 >= CharCodes2.Zero && c2 <= CharCodes2.Nine;
}
function isASCIIAlpha(c2) {
  return c2 >= CharCodes2.LowerA && c2 <= CharCodes2.LowerZ || c2 >= CharCodes2.UpperA && c2 <= CharCodes2.UpperZ;
}
function isHexDigit(c2) {
  return c2 >= CharCodes2.UpperA && c2 <= CharCodes2.UpperF || c2 >= CharCodes2.LowerA && c2 <= CharCodes2.LowerF;
}
var QuoteType;
(function(QuoteType2) {
  QuoteType2[QuoteType2["NoValue"] = 0] = "NoValue";
  QuoteType2[QuoteType2["Unquoted"] = 1] = "Unquoted";
  QuoteType2[QuoteType2["Single"] = 2] = "Single";
  QuoteType2[QuoteType2["Double"] = 3] = "Double";
})(QuoteType || (QuoteType = {}));
var Sequences = {
  Cdata: new Uint8Array([67, 68, 65, 84, 65, 91]),
  CdataEnd: new Uint8Array([93, 93, 62]),
  CommentEnd: new Uint8Array([45, 45, 62]),
  ScriptEnd: new Uint8Array([60, 47, 115, 99, 114, 105, 112, 116]),
  StyleEnd: new Uint8Array([60, 47, 115, 116, 121, 108, 101]),
  TitleEnd: new Uint8Array([60, 47, 116, 105, 116, 108, 101])
};

class Tokenizer {
  constructor({ xmlMode = false, decodeEntities = true }, cbs) {
    this.cbs = cbs;
    this.state = State.Text;
    this.buffer = "";
    this.sectionStart = 0;
    this.index = 0;
    this.baseState = State.Text;
    this.isSpecial = false;
    this.running = true;
    this.offset = 0;
    this.currentSequence = undefined;
    this.sequenceIndex = 0;
    this.trieIndex = 0;
    this.trieCurrent = 0;
    this.entityResult = 0;
    this.entityExcess = 0;
    this.xmlMode = xmlMode;
    this.decodeEntities = decodeEntities;
    this.entityTrie = xmlMode ? decode_data_xml_default : decode_data_html_default;
  }
  reset() {
    this.state = State.Text;
    this.buffer = "";
    this.sectionStart = 0;
    this.index = 0;
    this.baseState = State.Text;
    this.currentSequence = undefined;
    this.running = true;
    this.offset = 0;
  }
  write(chunk) {
    this.offset += this.buffer.length;
    this.buffer = chunk;
    this.parse();
  }
  end() {
    if (this.running)
      this.finish();
  }
  pause() {
    this.running = false;
  }
  resume() {
    this.running = true;
    if (this.index < this.buffer.length + this.offset) {
      this.parse();
    }
  }
  getIndex() {
    return this.index;
  }
  getSectionStart() {
    return this.sectionStart;
  }
  stateText(c2) {
    if (c2 === CharCodes2.Lt || !this.decodeEntities && this.fastForwardTo(CharCodes2.Lt)) {
      if (this.index > this.sectionStart) {
        this.cbs.ontext(this.sectionStart, this.index);
      }
      this.state = State.BeforeTagName;
      this.sectionStart = this.index;
    } else if (this.decodeEntities && c2 === CharCodes2.Amp) {
      this.state = State.BeforeEntity;
    }
  }
  stateSpecialStartSequence(c2) {
    const isEnd = this.sequenceIndex === this.currentSequence.length;
    const isMatch = isEnd ? isEndOfTagSection(c2) : (c2 | 32) === this.currentSequence[this.sequenceIndex];
    if (!isMatch) {
      this.isSpecial = false;
    } else if (!isEnd) {
      this.sequenceIndex++;
      return;
    }
    this.sequenceIndex = 0;
    this.state = State.InTagName;
    this.stateInTagName(c2);
  }
  stateInSpecialTag(c2) {
    if (this.sequenceIndex === this.currentSequence.length) {
      if (c2 === CharCodes2.Gt || isWhitespace(c2)) {
        const endOfText = this.index - this.currentSequence.length;
        if (this.sectionStart < endOfText) {
          const actualIndex = this.index;
          this.index = endOfText;
          this.cbs.ontext(this.sectionStart, endOfText);
          this.index = actualIndex;
        }
        this.isSpecial = false;
        this.sectionStart = endOfText + 2;
        this.stateInClosingTagName(c2);
        return;
      }
      this.sequenceIndex = 0;
    }
    if ((c2 | 32) === this.currentSequence[this.sequenceIndex]) {
      this.sequenceIndex += 1;
    } else if (this.sequenceIndex === 0) {
      if (this.currentSequence === Sequences.TitleEnd) {
        if (this.decodeEntities && c2 === CharCodes2.Amp) {
          this.state = State.BeforeEntity;
        }
      } else if (this.fastForwardTo(CharCodes2.Lt)) {
        this.sequenceIndex = 1;
      }
    } else {
      this.sequenceIndex = Number(c2 === CharCodes2.Lt);
    }
  }
  stateCDATASequence(c2) {
    if (c2 === Sequences.Cdata[this.sequenceIndex]) {
      if (++this.sequenceIndex === Sequences.Cdata.length) {
        this.state = State.InCommentLike;
        this.currentSequence = Sequences.CdataEnd;
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
      }
    } else {
      this.sequenceIndex = 0;
      this.state = State.InDeclaration;
      this.stateInDeclaration(c2);
    }
  }
  fastForwardTo(c2) {
    while (++this.index < this.buffer.length + this.offset) {
      if (this.buffer.charCodeAt(this.index - this.offset) === c2) {
        return true;
      }
    }
    this.index = this.buffer.length + this.offset - 1;
    return false;
  }
  stateInCommentLike(c2) {
    if (c2 === this.currentSequence[this.sequenceIndex]) {
      if (++this.sequenceIndex === this.currentSequence.length) {
        if (this.currentSequence === Sequences.CdataEnd) {
          this.cbs.oncdata(this.sectionStart, this.index, 2);
        } else {
          this.cbs.oncomment(this.sectionStart, this.index, 2);
        }
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
        this.state = State.Text;
      }
    } else if (this.sequenceIndex === 0) {
      if (this.fastForwardTo(this.currentSequence[0])) {
        this.sequenceIndex = 1;
      }
    } else if (c2 !== this.currentSequence[this.sequenceIndex - 1]) {
      this.sequenceIndex = 0;
    }
  }
  isTagStartChar(c2) {
    return this.xmlMode ? !isEndOfTagSection(c2) : isASCIIAlpha(c2);
  }
  startSpecial(sequence, offset) {
    this.isSpecial = true;
    this.currentSequence = sequence;
    this.sequenceIndex = offset;
    this.state = State.SpecialStartSequence;
  }
  stateBeforeTagName(c2) {
    if (c2 === CharCodes2.ExclamationMark) {
      this.state = State.BeforeDeclaration;
      this.sectionStart = this.index + 1;
    } else if (c2 === CharCodes2.Questionmark) {
      this.state = State.InProcessingInstruction;
      this.sectionStart = this.index + 1;
    } else if (this.isTagStartChar(c2)) {
      const lower = c2 | 32;
      this.sectionStart = this.index;
      if (!this.xmlMode && lower === Sequences.TitleEnd[2]) {
        this.startSpecial(Sequences.TitleEnd, 3);
      } else {
        this.state = !this.xmlMode && lower === Sequences.ScriptEnd[2] ? State.BeforeSpecialS : State.InTagName;
      }
    } else if (c2 === CharCodes2.Slash) {
      this.state = State.BeforeClosingTagName;
    } else {
      this.state = State.Text;
      this.stateText(c2);
    }
  }
  stateInTagName(c2) {
    if (isEndOfTagSection(c2)) {
      this.cbs.onopentagname(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c2);
    }
  }
  stateBeforeClosingTagName(c2) {
    if (isWhitespace(c2)) {} else if (c2 === CharCodes2.Gt) {
      this.state = State.Text;
    } else {
      this.state = this.isTagStartChar(c2) ? State.InClosingTagName : State.InSpecialComment;
      this.sectionStart = this.index;
    }
  }
  stateInClosingTagName(c2) {
    if (c2 === CharCodes2.Gt || isWhitespace(c2)) {
      this.cbs.onclosetag(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.state = State.AfterClosingTagName;
      this.stateAfterClosingTagName(c2);
    }
  }
  stateAfterClosingTagName(c2) {
    if (c2 === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.state = State.Text;
      this.baseState = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeAttributeName(c2) {
    if (c2 === CharCodes2.Gt) {
      this.cbs.onopentagend(this.index);
      if (this.isSpecial) {
        this.state = State.InSpecialTag;
        this.sequenceIndex = 0;
      } else {
        this.state = State.Text;
      }
      this.baseState = this.state;
      this.sectionStart = this.index + 1;
    } else if (c2 === CharCodes2.Slash) {
      this.state = State.InSelfClosingTag;
    } else if (!isWhitespace(c2)) {
      this.state = State.InAttributeName;
      this.sectionStart = this.index;
    }
  }
  stateInSelfClosingTag(c2) {
    if (c2 === CharCodes2.Gt) {
      this.cbs.onselfclosingtag(this.index);
      this.state = State.Text;
      this.baseState = State.Text;
      this.sectionStart = this.index + 1;
      this.isSpecial = false;
    } else if (!isWhitespace(c2)) {
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c2);
    }
  }
  stateInAttributeName(c2) {
    if (c2 === CharCodes2.Eq || isEndOfTagSection(c2)) {
      this.cbs.onattribname(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.state = State.AfterAttributeName;
      this.stateAfterAttributeName(c2);
    }
  }
  stateAfterAttributeName(c2) {
    if (c2 === CharCodes2.Eq) {
      this.state = State.BeforeAttributeValue;
    } else if (c2 === CharCodes2.Slash || c2 === CharCodes2.Gt) {
      this.cbs.onattribend(QuoteType.NoValue, this.index);
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c2);
    } else if (!isWhitespace(c2)) {
      this.cbs.onattribend(QuoteType.NoValue, this.index);
      this.state = State.InAttributeName;
      this.sectionStart = this.index;
    }
  }
  stateBeforeAttributeValue(c2) {
    if (c2 === CharCodes2.DoubleQuote) {
      this.state = State.InAttributeValueDq;
      this.sectionStart = this.index + 1;
    } else if (c2 === CharCodes2.SingleQuote) {
      this.state = State.InAttributeValueSq;
      this.sectionStart = this.index + 1;
    } else if (!isWhitespace(c2)) {
      this.sectionStart = this.index;
      this.state = State.InAttributeValueNq;
      this.stateInAttributeValueNoQuotes(c2);
    }
  }
  handleInAttributeValue(c2, quote) {
    if (c2 === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
      this.cbs.onattribdata(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.cbs.onattribend(quote === CharCodes2.DoubleQuote ? QuoteType.Double : QuoteType.Single, this.index);
      this.state = State.BeforeAttributeName;
    } else if (this.decodeEntities && c2 === CharCodes2.Amp) {
      this.baseState = this.state;
      this.state = State.BeforeEntity;
    }
  }
  stateInAttributeValueDoubleQuotes(c2) {
    this.handleInAttributeValue(c2, CharCodes2.DoubleQuote);
  }
  stateInAttributeValueSingleQuotes(c2) {
    this.handleInAttributeValue(c2, CharCodes2.SingleQuote);
  }
  stateInAttributeValueNoQuotes(c2) {
    if (isWhitespace(c2) || c2 === CharCodes2.Gt) {
      this.cbs.onattribdata(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.cbs.onattribend(QuoteType.Unquoted, this.index);
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c2);
    } else if (this.decodeEntities && c2 === CharCodes2.Amp) {
      this.baseState = this.state;
      this.state = State.BeforeEntity;
    }
  }
  stateBeforeDeclaration(c2) {
    if (c2 === CharCodes2.OpeningSquareBracket) {
      this.state = State.CDATASequence;
      this.sequenceIndex = 0;
    } else {
      this.state = c2 === CharCodes2.Dash ? State.BeforeComment : State.InDeclaration;
    }
  }
  stateInDeclaration(c2) {
    if (c2 === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.cbs.ondeclaration(this.sectionStart, this.index);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateInProcessingInstruction(c2) {
    if (c2 === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.cbs.onprocessinginstruction(this.sectionStart, this.index);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeComment(c2) {
    if (c2 === CharCodes2.Dash) {
      this.state = State.InCommentLike;
      this.currentSequence = Sequences.CommentEnd;
      this.sequenceIndex = 2;
      this.sectionStart = this.index + 1;
    } else {
      this.state = State.InDeclaration;
    }
  }
  stateInSpecialComment(c2) {
    if (c2 === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.cbs.oncomment(this.sectionStart, this.index, 0);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeSpecialS(c2) {
    const lower = c2 | 32;
    if (lower === Sequences.ScriptEnd[3]) {
      this.startSpecial(Sequences.ScriptEnd, 4);
    } else if (lower === Sequences.StyleEnd[3]) {
      this.startSpecial(Sequences.StyleEnd, 4);
    } else {
      this.state = State.InTagName;
      this.stateInTagName(c2);
    }
  }
  stateBeforeEntity(c2) {
    this.entityExcess = 1;
    this.entityResult = 0;
    if (c2 === CharCodes2.Number) {
      this.state = State.BeforeNumericEntity;
    } else if (c2 === CharCodes2.Amp) {} else {
      this.trieIndex = 0;
      this.trieCurrent = this.entityTrie[0];
      this.state = State.InNamedEntity;
      this.stateInNamedEntity(c2);
    }
  }
  stateInNamedEntity(c2) {
    this.entityExcess += 1;
    this.trieIndex = determineBranch(this.entityTrie, this.trieCurrent, this.trieIndex + 1, c2);
    if (this.trieIndex < 0) {
      this.emitNamedEntity();
      this.index--;
      return;
    }
    this.trieCurrent = this.entityTrie[this.trieIndex];
    const masked = this.trieCurrent & BinTrieFlags.VALUE_LENGTH;
    if (masked) {
      const valueLength = (masked >> 14) - 1;
      if (!this.allowLegacyEntity() && c2 !== CharCodes2.Semi) {
        this.trieIndex += valueLength;
      } else {
        const entityStart = this.index - this.entityExcess + 1;
        if (entityStart > this.sectionStart) {
          this.emitPartial(this.sectionStart, entityStart);
        }
        this.entityResult = this.trieIndex;
        this.trieIndex += valueLength;
        this.entityExcess = 0;
        this.sectionStart = this.index + 1;
        if (valueLength === 0) {
          this.emitNamedEntity();
        }
      }
    }
  }
  emitNamedEntity() {
    this.state = this.baseState;
    if (this.entityResult === 0) {
      return;
    }
    const valueLength = (this.entityTrie[this.entityResult] & BinTrieFlags.VALUE_LENGTH) >> 14;
    switch (valueLength) {
      case 1: {
        this.emitCodePoint(this.entityTrie[this.entityResult] & ~BinTrieFlags.VALUE_LENGTH);
        break;
      }
      case 2: {
        this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
        break;
      }
      case 3: {
        this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
        this.emitCodePoint(this.entityTrie[this.entityResult + 2]);
      }
    }
  }
  stateBeforeNumericEntity(c2) {
    if ((c2 | 32) === CharCodes2.LowerX) {
      this.entityExcess++;
      this.state = State.InHexEntity;
    } else {
      this.state = State.InNumericEntity;
      this.stateInNumericEntity(c2);
    }
  }
  emitNumericEntity(strict) {
    const entityStart = this.index - this.entityExcess - 1;
    const numberStart = entityStart + 2 + Number(this.state === State.InHexEntity);
    if (numberStart !== this.index) {
      if (entityStart > this.sectionStart) {
        this.emitPartial(this.sectionStart, entityStart);
      }
      this.sectionStart = this.index + Number(strict);
      this.emitCodePoint(replaceCodePoint(this.entityResult));
    }
    this.state = this.baseState;
  }
  stateInNumericEntity(c2) {
    if (c2 === CharCodes2.Semi) {
      this.emitNumericEntity(true);
    } else if (isNumber2(c2)) {
      this.entityResult = this.entityResult * 10 + (c2 - CharCodes2.Zero);
      this.entityExcess++;
    } else {
      if (this.allowLegacyEntity()) {
        this.emitNumericEntity(false);
      } else {
        this.state = this.baseState;
      }
      this.index--;
    }
  }
  stateInHexEntity(c2) {
    if (c2 === CharCodes2.Semi) {
      this.emitNumericEntity(true);
    } else if (isNumber2(c2)) {
      this.entityResult = this.entityResult * 16 + (c2 - CharCodes2.Zero);
      this.entityExcess++;
    } else if (isHexDigit(c2)) {
      this.entityResult = this.entityResult * 16 + ((c2 | 32) - CharCodes2.LowerA + 10);
      this.entityExcess++;
    } else {
      if (this.allowLegacyEntity()) {
        this.emitNumericEntity(false);
      } else {
        this.state = this.baseState;
      }
      this.index--;
    }
  }
  allowLegacyEntity() {
    return !this.xmlMode && (this.baseState === State.Text || this.baseState === State.InSpecialTag);
  }
  cleanup() {
    if (this.running && this.sectionStart !== this.index) {
      if (this.state === State.Text || this.state === State.InSpecialTag && this.sequenceIndex === 0) {
        this.cbs.ontext(this.sectionStart, this.index);
        this.sectionStart = this.index;
      } else if (this.state === State.InAttributeValueDq || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueNq) {
        this.cbs.onattribdata(this.sectionStart, this.index);
        this.sectionStart = this.index;
      }
    }
  }
  shouldContinue() {
    return this.index < this.buffer.length + this.offset && this.running;
  }
  parse() {
    while (this.shouldContinue()) {
      const c2 = this.buffer.charCodeAt(this.index - this.offset);
      switch (this.state) {
        case State.Text: {
          this.stateText(c2);
          break;
        }
        case State.SpecialStartSequence: {
          this.stateSpecialStartSequence(c2);
          break;
        }
        case State.InSpecialTag: {
          this.stateInSpecialTag(c2);
          break;
        }
        case State.CDATASequence: {
          this.stateCDATASequence(c2);
          break;
        }
        case State.InAttributeValueDq: {
          this.stateInAttributeValueDoubleQuotes(c2);
          break;
        }
        case State.InAttributeName: {
          this.stateInAttributeName(c2);
          break;
        }
        case State.InCommentLike: {
          this.stateInCommentLike(c2);
          break;
        }
        case State.InSpecialComment: {
          this.stateInSpecialComment(c2);
          break;
        }
        case State.BeforeAttributeName: {
          this.stateBeforeAttributeName(c2);
          break;
        }
        case State.InTagName: {
          this.stateInTagName(c2);
          break;
        }
        case State.InClosingTagName: {
          this.stateInClosingTagName(c2);
          break;
        }
        case State.BeforeTagName: {
          this.stateBeforeTagName(c2);
          break;
        }
        case State.AfterAttributeName: {
          this.stateAfterAttributeName(c2);
          break;
        }
        case State.InAttributeValueSq: {
          this.stateInAttributeValueSingleQuotes(c2);
          break;
        }
        case State.BeforeAttributeValue: {
          this.stateBeforeAttributeValue(c2);
          break;
        }
        case State.BeforeClosingTagName: {
          this.stateBeforeClosingTagName(c2);
          break;
        }
        case State.AfterClosingTagName: {
          this.stateAfterClosingTagName(c2);
          break;
        }
        case State.BeforeSpecialS: {
          this.stateBeforeSpecialS(c2);
          break;
        }
        case State.InAttributeValueNq: {
          this.stateInAttributeValueNoQuotes(c2);
          break;
        }
        case State.InSelfClosingTag: {
          this.stateInSelfClosingTag(c2);
          break;
        }
        case State.InDeclaration: {
          this.stateInDeclaration(c2);
          break;
        }
        case State.BeforeDeclaration: {
          this.stateBeforeDeclaration(c2);
          break;
        }
        case State.BeforeComment: {
          this.stateBeforeComment(c2);
          break;
        }
        case State.InProcessingInstruction: {
          this.stateInProcessingInstruction(c2);
          break;
        }
        case State.InNamedEntity: {
          this.stateInNamedEntity(c2);
          break;
        }
        case State.BeforeEntity: {
          this.stateBeforeEntity(c2);
          break;
        }
        case State.InHexEntity: {
          this.stateInHexEntity(c2);
          break;
        }
        case State.InNumericEntity: {
          this.stateInNumericEntity(c2);
          break;
        }
        default: {
          this.stateBeforeNumericEntity(c2);
        }
      }
      this.index++;
    }
    this.cleanup();
  }
  finish() {
    if (this.state === State.InNamedEntity) {
      this.emitNamedEntity();
    }
    if (this.sectionStart < this.index) {
      this.handleTrailingData();
    }
    this.cbs.onend();
  }
  handleTrailingData() {
    const endIndex = this.buffer.length + this.offset;
    if (this.state === State.InCommentLike) {
      if (this.currentSequence === Sequences.CdataEnd) {
        this.cbs.oncdata(this.sectionStart, endIndex, 0);
      } else {
        this.cbs.oncomment(this.sectionStart, endIndex, 0);
      }
    } else if (this.state === State.InNumericEntity && this.allowLegacyEntity()) {
      this.emitNumericEntity(false);
    } else if (this.state === State.InHexEntity && this.allowLegacyEntity()) {
      this.emitNumericEntity(false);
    } else if (this.state === State.InTagName || this.state === State.BeforeAttributeName || this.state === State.BeforeAttributeValue || this.state === State.AfterAttributeName || this.state === State.InAttributeName || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueDq || this.state === State.InAttributeValueNq || this.state === State.InClosingTagName) {} else {
      this.cbs.ontext(this.sectionStart, endIndex);
    }
  }
  emitPartial(start, endIndex) {
    if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) {
      this.cbs.onattribdata(start, endIndex);
    } else {
      this.cbs.ontext(start, endIndex);
    }
  }
  emitCodePoint(cp) {
    if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) {
      this.cbs.onattribentity(cp);
    } else {
      this.cbs.ontextentity(cp);
    }
  }
}

// node_modules/htmlparser2/lib/esm/Parser.js
var formTags = new Set([
  "input",
  "option",
  "optgroup",
  "select",
  "button",
  "datalist",
  "textarea"
]);
var pTag = new Set(["p"]);
var tableSectionTags = new Set(["thead", "tbody"]);
var ddtTags = new Set(["dd", "dt"]);
var rtpTags = new Set(["rt", "rp"]);
var openImpliesClose = new Map([
  ["tr", new Set(["tr", "th", "td"])],
  ["th", new Set(["th"])],
  ["td", new Set(["thead", "th", "td"])],
  ["body", new Set(["head", "link", "script"])],
  ["li", new Set(["li"])],
  ["p", pTag],
  ["h1", pTag],
  ["h2", pTag],
  ["h3", pTag],
  ["h4", pTag],
  ["h5", pTag],
  ["h6", pTag],
  ["select", formTags],
  ["input", formTags],
  ["output", formTags],
  ["button", formTags],
  ["datalist", formTags],
  ["textarea", formTags],
  ["option", new Set(["option"])],
  ["optgroup", new Set(["optgroup", "option"])],
  ["dd", ddtTags],
  ["dt", ddtTags],
  ["address", pTag],
  ["article", pTag],
  ["aside", pTag],
  ["blockquote", pTag],
  ["details", pTag],
  ["div", pTag],
  ["dl", pTag],
  ["fieldset", pTag],
  ["figcaption", pTag],
  ["figure", pTag],
  ["footer", pTag],
  ["form", pTag],
  ["header", pTag],
  ["hr", pTag],
  ["main", pTag],
  ["nav", pTag],
  ["ol", pTag],
  ["pre", pTag],
  ["section", pTag],
  ["table", pTag],
  ["ul", pTag],
  ["rt", rtpTags],
  ["rp", rtpTags],
  ["tbody", tableSectionTags],
  ["tfoot", tableSectionTags]
]);
var voidElements = new Set([
  "area",
  "base",
  "basefont",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "isindex",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
var foreignContextElements = new Set(["math", "svg"]);
var htmlIntegrationElements = new Set([
  "mi",
  "mo",
  "mn",
  "ms",
  "mtext",
  "annotation-xml",
  "foreignobject",
  "desc",
  "title"
]);
var reNameEnd = /\s|\//;

class Parser {
  constructor(cbs, options = {}) {
    var _a2, _b, _c, _d, _e;
    this.options = options;
    this.startIndex = 0;
    this.endIndex = 0;
    this.openTagStart = 0;
    this.tagname = "";
    this.attribname = "";
    this.attribvalue = "";
    this.attribs = null;
    this.stack = [];
    this.foreignContext = [];
    this.buffers = [];
    this.bufferOffset = 0;
    this.writeIndex = 0;
    this.ended = false;
    this.cbs = cbs !== null && cbs !== undefined ? cbs : {};
    this.lowerCaseTagNames = (_a2 = options.lowerCaseTags) !== null && _a2 !== undefined ? _a2 : !options.xmlMode;
    this.lowerCaseAttributeNames = (_b = options.lowerCaseAttributeNames) !== null && _b !== undefined ? _b : !options.xmlMode;
    this.tokenizer = new ((_c = options.Tokenizer) !== null && _c !== undefined ? _c : Tokenizer)(this.options, this);
    (_e = (_d = this.cbs).onparserinit) === null || _e === undefined || _e.call(_d, this);
  }
  ontext(start, endIndex) {
    var _a2, _b;
    const data = this.getSlice(start, endIndex);
    this.endIndex = endIndex - 1;
    (_b = (_a2 = this.cbs).ontext) === null || _b === undefined || _b.call(_a2, data);
    this.startIndex = endIndex;
  }
  ontextentity(cp) {
    var _a2, _b;
    const index = this.tokenizer.getSectionStart();
    this.endIndex = index - 1;
    (_b = (_a2 = this.cbs).ontext) === null || _b === undefined || _b.call(_a2, fromCodePoint(cp));
    this.startIndex = index;
  }
  isVoidElement(name2) {
    return !this.options.xmlMode && voidElements.has(name2);
  }
  onopentagname(start, endIndex) {
    this.endIndex = endIndex;
    let name2 = this.getSlice(start, endIndex);
    if (this.lowerCaseTagNames) {
      name2 = name2.toLowerCase();
    }
    this.emitOpenTag(name2);
  }
  emitOpenTag(name2) {
    var _a2, _b, _c, _d;
    this.openTagStart = this.startIndex;
    this.tagname = name2;
    const impliesClose = !this.options.xmlMode && openImpliesClose.get(name2);
    if (impliesClose) {
      while (this.stack.length > 0 && impliesClose.has(this.stack[this.stack.length - 1])) {
        const element = this.stack.pop();
        (_b = (_a2 = this.cbs).onclosetag) === null || _b === undefined || _b.call(_a2, element, true);
      }
    }
    if (!this.isVoidElement(name2)) {
      this.stack.push(name2);
      if (foreignContextElements.has(name2)) {
        this.foreignContext.push(true);
      } else if (htmlIntegrationElements.has(name2)) {
        this.foreignContext.push(false);
      }
    }
    (_d = (_c = this.cbs).onopentagname) === null || _d === undefined || _d.call(_c, name2);
    if (this.cbs.onopentag)
      this.attribs = {};
  }
  endOpenTag(isImplied) {
    var _a2, _b;
    this.startIndex = this.openTagStart;
    if (this.attribs) {
      (_b = (_a2 = this.cbs).onopentag) === null || _b === undefined || _b.call(_a2, this.tagname, this.attribs, isImplied);
      this.attribs = null;
    }
    if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) {
      this.cbs.onclosetag(this.tagname, true);
    }
    this.tagname = "";
  }
  onopentagend(endIndex) {
    this.endIndex = endIndex;
    this.endOpenTag(false);
    this.startIndex = endIndex + 1;
  }
  onclosetag(start, endIndex) {
    var _a2, _b, _c, _d, _e, _f;
    this.endIndex = endIndex;
    let name2 = this.getSlice(start, endIndex);
    if (this.lowerCaseTagNames) {
      name2 = name2.toLowerCase();
    }
    if (foreignContextElements.has(name2) || htmlIntegrationElements.has(name2)) {
      this.foreignContext.pop();
    }
    if (!this.isVoidElement(name2)) {
      const pos = this.stack.lastIndexOf(name2);
      if (pos !== -1) {
        if (this.cbs.onclosetag) {
          let count = this.stack.length - pos;
          while (count--) {
            this.cbs.onclosetag(this.stack.pop(), count !== 0);
          }
        } else
          this.stack.length = pos;
      } else if (!this.options.xmlMode && name2 === "p") {
        this.emitOpenTag("p");
        this.closeCurrentTag(true);
      }
    } else if (!this.options.xmlMode && name2 === "br") {
      (_b = (_a2 = this.cbs).onopentagname) === null || _b === undefined || _b.call(_a2, "br");
      (_d = (_c = this.cbs).onopentag) === null || _d === undefined || _d.call(_c, "br", {}, true);
      (_f = (_e = this.cbs).onclosetag) === null || _f === undefined || _f.call(_e, "br", false);
    }
    this.startIndex = endIndex + 1;
  }
  onselfclosingtag(endIndex) {
    this.endIndex = endIndex;
    if (this.options.xmlMode || this.options.recognizeSelfClosing || this.foreignContext[this.foreignContext.length - 1]) {
      this.closeCurrentTag(false);
      this.startIndex = endIndex + 1;
    } else {
      this.onopentagend(endIndex);
    }
  }
  closeCurrentTag(isOpenImplied) {
    var _a2, _b;
    const name2 = this.tagname;
    this.endOpenTag(isOpenImplied);
    if (this.stack[this.stack.length - 1] === name2) {
      (_b = (_a2 = this.cbs).onclosetag) === null || _b === undefined || _b.call(_a2, name2, !isOpenImplied);
      this.stack.pop();
    }
  }
  onattribname(start, endIndex) {
    this.startIndex = start;
    const name2 = this.getSlice(start, endIndex);
    this.attribname = this.lowerCaseAttributeNames ? name2.toLowerCase() : name2;
  }
  onattribdata(start, endIndex) {
    this.attribvalue += this.getSlice(start, endIndex);
  }
  onattribentity(cp) {
    this.attribvalue += fromCodePoint(cp);
  }
  onattribend(quote, endIndex) {
    var _a2, _b;
    this.endIndex = endIndex;
    (_b = (_a2 = this.cbs).onattribute) === null || _b === undefined || _b.call(_a2, this.attribname, this.attribvalue, quote === QuoteType.Double ? '"' : quote === QuoteType.Single ? "'" : quote === QuoteType.NoValue ? undefined : null);
    if (this.attribs && !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) {
      this.attribs[this.attribname] = this.attribvalue;
    }
    this.attribvalue = "";
  }
  getInstructionName(value) {
    const index = value.search(reNameEnd);
    let name2 = index < 0 ? value : value.substr(0, index);
    if (this.lowerCaseTagNames) {
      name2 = name2.toLowerCase();
    }
    return name2;
  }
  ondeclaration(start, endIndex) {
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex);
    if (this.cbs.onprocessinginstruction) {
      const name2 = this.getInstructionName(value);
      this.cbs.onprocessinginstruction(`!${name2}`, `!${value}`);
    }
    this.startIndex = endIndex + 1;
  }
  onprocessinginstruction(start, endIndex) {
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex);
    if (this.cbs.onprocessinginstruction) {
      const name2 = this.getInstructionName(value);
      this.cbs.onprocessinginstruction(`?${name2}`, `?${value}`);
    }
    this.startIndex = endIndex + 1;
  }
  oncomment(start, endIndex, offset) {
    var _a2, _b, _c, _d;
    this.endIndex = endIndex;
    (_b = (_a2 = this.cbs).oncomment) === null || _b === undefined || _b.call(_a2, this.getSlice(start, endIndex - offset));
    (_d = (_c = this.cbs).oncommentend) === null || _d === undefined || _d.call(_c);
    this.startIndex = endIndex + 1;
  }
  oncdata(start, endIndex, offset) {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex - offset);
    if (this.options.xmlMode || this.options.recognizeCDATA) {
      (_b = (_a2 = this.cbs).oncdatastart) === null || _b === undefined || _b.call(_a2);
      (_d = (_c = this.cbs).ontext) === null || _d === undefined || _d.call(_c, value);
      (_f = (_e = this.cbs).oncdataend) === null || _f === undefined || _f.call(_e);
    } else {
      (_h = (_g = this.cbs).oncomment) === null || _h === undefined || _h.call(_g, `[CDATA[${value}]]`);
      (_k = (_j = this.cbs).oncommentend) === null || _k === undefined || _k.call(_j);
    }
    this.startIndex = endIndex + 1;
  }
  onend() {
    var _a2, _b;
    if (this.cbs.onclosetag) {
      this.endIndex = this.startIndex;
      for (let index = this.stack.length;index > 0; this.cbs.onclosetag(this.stack[--index], true))
        ;
    }
    (_b = (_a2 = this.cbs).onend) === null || _b === undefined || _b.call(_a2);
  }
  reset() {
    var _a2, _b, _c, _d;
    (_b = (_a2 = this.cbs).onreset) === null || _b === undefined || _b.call(_a2);
    this.tokenizer.reset();
    this.tagname = "";
    this.attribname = "";
    this.attribs = null;
    this.stack.length = 0;
    this.startIndex = 0;
    this.endIndex = 0;
    (_d = (_c = this.cbs).onparserinit) === null || _d === undefined || _d.call(_c, this);
    this.buffers.length = 0;
    this.bufferOffset = 0;
    this.writeIndex = 0;
    this.ended = false;
  }
  parseComplete(data) {
    this.reset();
    this.end(data);
  }
  getSlice(start, end) {
    while (start - this.bufferOffset >= this.buffers[0].length) {
      this.shiftBuffer();
    }
    let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
    while (end - this.bufferOffset > this.buffers[0].length) {
      this.shiftBuffer();
      slice += this.buffers[0].slice(0, end - this.bufferOffset);
    }
    return slice;
  }
  shiftBuffer() {
    this.bufferOffset += this.buffers[0].length;
    this.writeIndex--;
    this.buffers.shift();
  }
  write(chunk) {
    var _a2, _b;
    if (this.ended) {
      (_b = (_a2 = this.cbs).onerror) === null || _b === undefined || _b.call(_a2, new Error(".write() after done!"));
      return;
    }
    this.buffers.push(chunk);
    if (this.tokenizer.running) {
      this.tokenizer.write(chunk);
      this.writeIndex++;
    }
  }
  end(chunk) {
    var _a2, _b;
    if (this.ended) {
      (_b = (_a2 = this.cbs).onerror) === null || _b === undefined || _b.call(_a2, new Error(".end() after done!"));
      return;
    }
    if (chunk)
      this.write(chunk);
    this.ended = true;
    this.tokenizer.end();
  }
  pause() {
    this.tokenizer.pause();
  }
  resume() {
    this.tokenizer.resume();
    while (this.tokenizer.running && this.writeIndex < this.buffers.length) {
      this.tokenizer.write(this.buffers[this.writeIndex++]);
    }
    if (this.ended)
      this.tokenizer.end();
  }
  parseChunk(chunk) {
    this.write(chunk);
  }
  done(chunk) {
    this.end(chunk);
  }
}
// node_modules/entities/lib/esm/escape.js
var xmlReplacer = /["&'<>$\x80-\uFFFF]/g;
var xmlCodeMap = new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [39, "&apos;"],
  [60, "&lt;"],
  [62, "&gt;"]
]);
var getCodePoint = String.prototype.codePointAt != null ? (str, index) => str.codePointAt(index) : (c2, index) => (c2.charCodeAt(index) & 64512) === 55296 ? (c2.charCodeAt(index) - 55296) * 1024 + c2.charCodeAt(index + 1) - 56320 + 65536 : c2.charCodeAt(index);
function encodeXML(str) {
  let ret = "";
  let lastIdx = 0;
  let match;
  while ((match = xmlReplacer.exec(str)) !== null) {
    const i = match.index;
    const char = str.charCodeAt(i);
    const next = xmlCodeMap.get(char);
    if (next !== undefined) {
      ret += str.substring(lastIdx, i) + next;
      lastIdx = i + 1;
    } else {
      ret += `${str.substring(lastIdx, i)}&#x${getCodePoint(str, i).toString(16)};`;
      lastIdx = xmlReplacer.lastIndex += Number((char & 64512) === 55296);
    }
  }
  return ret + str.substr(lastIdx);
}
function getEscaper(regex, map2) {
  return function escape3(data) {
    let match;
    let lastIdx = 0;
    let result = "";
    while (match = regex.exec(data)) {
      if (lastIdx !== match.index) {
        result += data.substring(lastIdx, match.index);
      }
      result += map2.get(match[0].charCodeAt(0));
      lastIdx = match.index + 1;
    }
    return result + data.substring(lastIdx);
  };
}
var escapeUTF8 = getEscaper(/[&<>'"]/g, xmlCodeMap);
var escapeAttribute = getEscaper(/["&\u00A0]/g, new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [160, "&nbsp;"]
]));
var escapeText = getEscaper(/[&<>\u00A0]/g, new Map([
  [38, "&amp;"],
  [60, "&lt;"],
  [62, "&gt;"],
  [160, "&nbsp;"]
]));
// node_modules/entities/lib/esm/index.js
var EntityLevel;
(function(EntityLevel2) {
  EntityLevel2[EntityLevel2["XML"] = 0] = "XML";
  EntityLevel2[EntityLevel2["HTML"] = 1] = "HTML";
})(EntityLevel || (EntityLevel = {}));
var EncodingMode;
(function(EncodingMode2) {
  EncodingMode2[EncodingMode2["UTF8"] = 0] = "UTF8";
  EncodingMode2[EncodingMode2["ASCII"] = 1] = "ASCII";
  EncodingMode2[EncodingMode2["Extensive"] = 2] = "Extensive";
  EncodingMode2[EncodingMode2["Attribute"] = 3] = "Attribute";
  EncodingMode2[EncodingMode2["Text"] = 4] = "Text";
})(EncodingMode || (EncodingMode = {}));

// node_modules/dom-serializer/lib/esm/foreignNames.js
var elementNames = new Map([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "clipPath",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "foreignObject",
  "glyphRef",
  "linearGradient",
  "radialGradient",
  "textPath"
].map((val) => [val.toLowerCase(), val]));
var attributeNames = new Map([
  "definitionURL",
  "attributeName",
  "attributeType",
  "baseFrequency",
  "baseProfile",
  "calcMode",
  "clipPathUnits",
  "diffuseConstant",
  "edgeMode",
  "filterUnits",
  "glyphRef",
  "gradientTransform",
  "gradientUnits",
  "kernelMatrix",
  "kernelUnitLength",
  "keyPoints",
  "keySplines",
  "keyTimes",
  "lengthAdjust",
  "limitingConeAngle",
  "markerHeight",
  "markerUnits",
  "markerWidth",
  "maskContentUnits",
  "maskUnits",
  "numOctaves",
  "pathLength",
  "patternContentUnits",
  "patternTransform",
  "patternUnits",
  "pointsAtX",
  "pointsAtY",
  "pointsAtZ",
  "preserveAlpha",
  "preserveAspectRatio",
  "primitiveUnits",
  "refX",
  "refY",
  "repeatCount",
  "repeatDur",
  "requiredExtensions",
  "requiredFeatures",
  "specularConstant",
  "specularExponent",
  "spreadMethod",
  "startOffset",
  "stdDeviation",
  "stitchTiles",
  "surfaceScale",
  "systemLanguage",
  "tableValues",
  "targetX",
  "targetY",
  "textLength",
  "viewBox",
  "viewTarget",
  "xChannelSelector",
  "yChannelSelector",
  "zoomAndPan"
].map((val) => [val.toLowerCase(), val]));

// node_modules/dom-serializer/lib/esm/index.js
var unencodedElements = new Set([
  "style",
  "script",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "plaintext",
  "noscript"
]);
function replaceQuotes(value) {
  return value.replace(/"/g, "&quot;");
}
function formatAttributes(attributes, opts) {
  var _a2;
  if (!attributes)
    return;
  const encode = ((_a2 = opts.encodeEntities) !== null && _a2 !== undefined ? _a2 : opts.decodeEntities) === false ? replaceQuotes : opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML : escapeAttribute;
  return Object.keys(attributes).map((key) => {
    var _a3, _b;
    const value = (_a3 = attributes[key]) !== null && _a3 !== undefined ? _a3 : "";
    if (opts.xmlMode === "foreign") {
      key = (_b = attributeNames.get(key)) !== null && _b !== undefined ? _b : key;
    }
    if (!opts.emptyAttrs && !opts.xmlMode && value === "") {
      return key;
    }
    return `${key}="${encode(value)}"`;
  }).join(" ");
}
var singleTag = new Set([
  "area",
  "base",
  "basefont",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "isindex",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
function render(node2, options = {}) {
  const nodes = "length" in node2 ? node2 : [node2];
  let output = "";
  for (let i = 0;i < nodes.length; i++) {
    output += renderNode(nodes[i], options);
  }
  return output;
}
function renderNode(node2, options) {
  switch (node2.type) {
    case Root:
      return render(node2.children, options);
    case Doctype:
    case Directive:
      return renderDirective(node2);
    case Comment:
      return renderComment(node2);
    case CDATA:
      return renderCdata(node2);
    case Script:
    case Style:
    case Tag:
      return renderTag(node2, options);
    case Text:
      return renderText(node2, options);
  }
}
var foreignModeIntegrationPoints = new Set([
  "mi",
  "mo",
  "mn",
  "ms",
  "mtext",
  "annotation-xml",
  "foreignObject",
  "desc",
  "title"
]);
var foreignElements = new Set(["svg", "math"]);
function renderTag(elem, opts) {
  var _a2;
  if (opts.xmlMode === "foreign") {
    elem.name = (_a2 = elementNames.get(elem.name)) !== null && _a2 !== undefined ? _a2 : elem.name;
    if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) {
      opts = { ...opts, xmlMode: false };
    }
  }
  if (!opts.xmlMode && foreignElements.has(elem.name)) {
    opts = { ...opts, xmlMode: "foreign" };
  }
  let tag = `<${elem.name}`;
  const attribs = formatAttributes(elem.attribs, opts);
  if (attribs) {
    tag += ` ${attribs}`;
  }
  if (elem.children.length === 0 && (opts.xmlMode ? opts.selfClosingTags !== false : opts.selfClosingTags && singleTag.has(elem.name))) {
    if (!opts.xmlMode)
      tag += " ";
    tag += "/>";
  } else {
    tag += ">";
    if (elem.children.length > 0) {
      tag += render(elem.children, opts);
    }
    if (opts.xmlMode || !singleTag.has(elem.name)) {
      tag += `</${elem.name}>`;
    }
  }
  return tag;
}
function renderDirective(elem) {
  return `<${elem.data}>`;
}
function renderText(elem, opts) {
  var _a2;
  let data = elem.data || "";
  if (((_a2 = opts.encodeEntities) !== null && _a2 !== undefined ? _a2 : opts.decodeEntities) !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) {
    data = opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML(data) : escapeText(data);
  }
  return data;
}
function renderCdata(elem) {
  return `<![CDATA[${elem.children[0].data}]]>`;
}
function renderComment(elem) {
  return `<!--${elem.data}-->`;
}

// node_modules/htmlparser2/lib/esm/index.js
function parseDocument(data, options) {
  const handler = new DomHandler(undefined, options);
  new Parser(handler, options).end(data);
  return handler.root;
}

// node_modules/html-to-text/lib/html-to-text.mjs
var import_deepmerge = __toESM(require_cjs(), 1);
function limitedDepthRecursive(n2, f, g = () => {
  return;
}) {
  if (n2 === undefined) {
    const f1 = function(...args) {
      return f(f1, ...args);
    };
    return f1;
  }
  if (n2 >= 0) {
    return function(...args) {
      return f(limitedDepthRecursive(n2 - 1, f, g), ...args);
    };
  }
  return g;
}
function trimCharacter(str, char) {
  let start = 0;
  let end = str.length;
  while (start < end && str[start] === char) {
    ++start;
  }
  while (end > start && str[end - 1] === char) {
    --end;
  }
  return start > 0 || end < str.length ? str.substring(start, end) : str;
}
function trimCharacterEnd(str, char) {
  let end = str.length;
  while (end > 0 && str[end - 1] === char) {
    --end;
  }
  return end < str.length ? str.substring(0, end) : str;
}
function unicodeEscape(str) {
  return str.replace(/[\s\S]/g, (c2) => "\\u" + c2.charCodeAt().toString(16).padStart(4, "0"));
}
function mergeDuplicatesPreferLast(items, getKey) {
  const map2 = new Map;
  for (let i = items.length;i-- > 0; ) {
    const item = items[i];
    const key = getKey(item);
    map2.set(key, map2.has(key) ? import_deepmerge.default(item, map2.get(key), { arrayMerge: overwriteMerge$1 }) : item);
  }
  return [...map2.values()].reverse();
}
var overwriteMerge$1 = (acc, src, options) => [...src];
function get(obj, path) {
  for (const key of path) {
    if (!obj) {
      return;
    }
    obj = obj[key];
  }
  return obj;
}
function numberToLetterSequence(num, baseChar = "a", base = 26) {
  const digits = [];
  do {
    num -= 1;
    digits.push(num % base);
    num = num / base >> 0;
  } while (num > 0);
  const baseCode = baseChar.charCodeAt(0);
  return digits.reverse().map((n2) => String.fromCharCode(baseCode + n2)).join("");
}
var I = ["I", "X", "C", "M"];
var V = ["V", "L", "D"];
function numberToRoman(num) {
  return [...num + ""].map((n2) => +n2).reverse().map((v, i) => v % 5 < 4 ? (v < 5 ? "" : V[i]) + I[i].repeat(v % 5) : I[i] + (v < 5 ? V[i] : I[i + 1])).reverse().join("");
}

class InlineTextBuilder {
  constructor(options, maxLineLength = undefined) {
    this.lines = [];
    this.nextLineWords = [];
    this.maxLineLength = maxLineLength || options.wordwrap || Number.MAX_VALUE;
    this.nextLineAvailableChars = this.maxLineLength;
    this.wrapCharacters = get(options, ["longWordSplit", "wrapCharacters"]) || [];
    this.forceWrapOnLimit = get(options, ["longWordSplit", "forceWrapOnLimit"]) || false;
    this.stashedSpace = false;
    this.wordBreakOpportunity = false;
  }
  pushWord(word, noWrap = false) {
    if (this.nextLineAvailableChars <= 0 && !noWrap) {
      this.startNewLine();
    }
    const isLineStart = this.nextLineWords.length === 0;
    const cost = word.length + (isLineStart ? 0 : 1);
    if (cost <= this.nextLineAvailableChars || noWrap) {
      this.nextLineWords.push(word);
      this.nextLineAvailableChars -= cost;
    } else {
      const [first, ...rest] = this.splitLongWord(word);
      if (!isLineStart) {
        this.startNewLine();
      }
      this.nextLineWords.push(first);
      this.nextLineAvailableChars -= first.length;
      for (const part of rest) {
        this.startNewLine();
        this.nextLineWords.push(part);
        this.nextLineAvailableChars -= part.length;
      }
    }
  }
  popWord() {
    const lastWord = this.nextLineWords.pop();
    if (lastWord !== undefined) {
      const isLineStart = this.nextLineWords.length === 0;
      const cost = lastWord.length + (isLineStart ? 0 : 1);
      this.nextLineAvailableChars += cost;
    }
    return lastWord;
  }
  concatWord(word, noWrap = false) {
    if (this.wordBreakOpportunity && word.length > this.nextLineAvailableChars) {
      this.pushWord(word, noWrap);
      this.wordBreakOpportunity = false;
    } else {
      const lastWord = this.popWord();
      this.pushWord(lastWord ? lastWord.concat(word) : word, noWrap);
    }
  }
  startNewLine(n2 = 1) {
    this.lines.push(this.nextLineWords);
    if (n2 > 1) {
      this.lines.push(...Array.from({ length: n2 - 1 }, () => []));
    }
    this.nextLineWords = [];
    this.nextLineAvailableChars = this.maxLineLength;
  }
  isEmpty() {
    return this.lines.length === 0 && this.nextLineWords.length === 0;
  }
  clear() {
    this.lines.length = 0;
    this.nextLineWords.length = 0;
    this.nextLineAvailableChars = this.maxLineLength;
  }
  toString() {
    return [...this.lines, this.nextLineWords].map((words) => words.join(" ")).join(`
`);
  }
  splitLongWord(word) {
    const parts = [];
    let idx = 0;
    while (word.length > this.maxLineLength) {
      const firstLine = word.substring(0, this.maxLineLength);
      const remainingChars = word.substring(this.maxLineLength);
      const splitIndex = firstLine.lastIndexOf(this.wrapCharacters[idx]);
      if (splitIndex > -1) {
        word = firstLine.substring(splitIndex + 1) + remainingChars;
        parts.push(firstLine.substring(0, splitIndex + 1));
      } else {
        idx++;
        if (idx < this.wrapCharacters.length) {
          word = firstLine + remainingChars;
        } else {
          if (this.forceWrapOnLimit) {
            parts.push(firstLine);
            word = remainingChars;
            if (word.length > this.maxLineLength) {
              continue;
            }
          } else {
            word = firstLine + remainingChars;
          }
          break;
        }
      }
    }
    parts.push(word);
    return parts;
  }
}

class StackItem {
  constructor(next = null) {
    this.next = next;
  }
  getRoot() {
    return this.next ? this.next : this;
  }
}

class BlockStackItem extends StackItem {
  constructor(options, next = null, leadingLineBreaks = 1, maxLineLength = undefined) {
    super(next);
    this.leadingLineBreaks = leadingLineBreaks;
    this.inlineTextBuilder = new InlineTextBuilder(options, maxLineLength);
    this.rawText = "";
    this.stashedLineBreaks = 0;
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class ListStackItem extends BlockStackItem {
  constructor(options, next = null, {
    interRowLineBreaks = 1,
    leadingLineBreaks = 2,
    maxLineLength = undefined,
    maxPrefixLength = 0,
    prefixAlign = "left"
  } = {}) {
    super(options, next, leadingLineBreaks, maxLineLength);
    this.maxPrefixLength = maxPrefixLength;
    this.prefixAlign = prefixAlign;
    this.interRowLineBreaks = interRowLineBreaks;
  }
}

class ListItemStackItem extends BlockStackItem {
  constructor(options, next = null, {
    leadingLineBreaks = 1,
    maxLineLength = undefined,
    prefix = ""
  } = {}) {
    super(options, next, leadingLineBreaks, maxLineLength);
    this.prefix = prefix;
  }
}

class TableStackItem extends StackItem {
  constructor(next = null) {
    super(next);
    this.rows = [];
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class TableRowStackItem extends StackItem {
  constructor(next = null) {
    super(next);
    this.cells = [];
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class TableCellStackItem extends StackItem {
  constructor(options, next = null, maxColumnWidth = undefined) {
    super(next);
    this.inlineTextBuilder = new InlineTextBuilder(options, maxColumnWidth);
    this.rawText = "";
    this.stashedLineBreaks = 0;
    this.isPre = next && next.isPre;
    this.isNoWrap = next && next.isNoWrap;
  }
}

class TransformerStackItem extends StackItem {
  constructor(next = null, transform) {
    super(next);
    this.transform = transform;
  }
}
function charactersToCodes(str) {
  return [...str].map((c2) => "\\u" + c2.charCodeAt(0).toString(16).padStart(4, "0")).join("");
}

class WhitespaceProcessor {
  constructor(options) {
    this.whitespaceChars = options.preserveNewlines ? options.whitespaceCharacters.replace(/\n/g, "") : options.whitespaceCharacters;
    const whitespaceCodes = charactersToCodes(this.whitespaceChars);
    this.leadingWhitespaceRe = new RegExp(`^[${whitespaceCodes}]`);
    this.trailingWhitespaceRe = new RegExp(`[${whitespaceCodes}]$`);
    this.allWhitespaceOrEmptyRe = new RegExp(`^[${whitespaceCodes}]*$`);
    this.newlineOrNonWhitespaceRe = new RegExp(`(\\n|[^\\n${whitespaceCodes}])`, "g");
    this.newlineOrNonNewlineStringRe = new RegExp(`(\\n|[^\\n]+)`, "g");
    if (options.preserveNewlines) {
      const wordOrNewlineRe = new RegExp(`\\n|[^\\n${whitespaceCodes}]+`, "gm");
      this.shrinkWrapAdd = function(text, inlineTextBuilder, transform = (str) => str, noWrap = false) {
        if (!text) {
          return;
        }
        const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
        let anyMatch = false;
        let m = wordOrNewlineRe.exec(text);
        if (m) {
          anyMatch = true;
          if (m[0] === `
`) {
            inlineTextBuilder.startNewLine();
          } else if (previouslyStashedSpace || this.testLeadingWhitespace(text)) {
            inlineTextBuilder.pushWord(transform(m[0]), noWrap);
          } else {
            inlineTextBuilder.concatWord(transform(m[0]), noWrap);
          }
          while ((m = wordOrNewlineRe.exec(text)) !== null) {
            if (m[0] === `
`) {
              inlineTextBuilder.startNewLine();
            } else {
              inlineTextBuilder.pushWord(transform(m[0]), noWrap);
            }
          }
        }
        inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch || this.testTrailingWhitespace(text);
      };
    } else {
      const wordRe = new RegExp(`[^${whitespaceCodes}]+`, "g");
      this.shrinkWrapAdd = function(text, inlineTextBuilder, transform = (str) => str, noWrap = false) {
        if (!text) {
          return;
        }
        const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
        let anyMatch = false;
        let m = wordRe.exec(text);
        if (m) {
          anyMatch = true;
          if (previouslyStashedSpace || this.testLeadingWhitespace(text)) {
            inlineTextBuilder.pushWord(transform(m[0]), noWrap);
          } else {
            inlineTextBuilder.concatWord(transform(m[0]), noWrap);
          }
          while ((m = wordRe.exec(text)) !== null) {
            inlineTextBuilder.pushWord(transform(m[0]), noWrap);
          }
        }
        inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch || this.testTrailingWhitespace(text);
      };
    }
  }
  addLiteral(text, inlineTextBuilder, noWrap = true) {
    if (!text) {
      return;
    }
    const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
    let anyMatch = false;
    let m = this.newlineOrNonNewlineStringRe.exec(text);
    if (m) {
      anyMatch = true;
      if (m[0] === `
`) {
        inlineTextBuilder.startNewLine();
      } else if (previouslyStashedSpace) {
        inlineTextBuilder.pushWord(m[0], noWrap);
      } else {
        inlineTextBuilder.concatWord(m[0], noWrap);
      }
      while ((m = this.newlineOrNonNewlineStringRe.exec(text)) !== null) {
        if (m[0] === `
`) {
          inlineTextBuilder.startNewLine();
        } else {
          inlineTextBuilder.pushWord(m[0], noWrap);
        }
      }
    }
    inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch;
  }
  testLeadingWhitespace(text) {
    return this.leadingWhitespaceRe.test(text);
  }
  testTrailingWhitespace(text) {
    return this.trailingWhitespaceRe.test(text);
  }
  testContainsWords(text) {
    return !this.allWhitespaceOrEmptyRe.test(text);
  }
  countNewlinesNoWords(text) {
    this.newlineOrNonWhitespaceRe.lastIndex = 0;
    let counter = 0;
    let match;
    while ((match = this.newlineOrNonWhitespaceRe.exec(text)) !== null) {
      if (match[0] === `
`) {
        counter++;
      } else {
        return 0;
      }
    }
    return counter;
  }
}

class BlockTextBuilder {
  constructor(options, picker, metadata = undefined) {
    this.options = options;
    this.picker = picker;
    this.metadata = metadata;
    this.whitespaceProcessor = new WhitespaceProcessor(options);
    this._stackItem = new BlockStackItem(options);
    this._wordTransformer = undefined;
  }
  pushWordTransform(wordTransform) {
    this._wordTransformer = new TransformerStackItem(this._wordTransformer, wordTransform);
  }
  popWordTransform() {
    if (!this._wordTransformer) {
      return;
    }
    const transform = this._wordTransformer.transform;
    this._wordTransformer = this._wordTransformer.next;
    return transform;
  }
  startNoWrap() {
    this._stackItem.isNoWrap = true;
  }
  stopNoWrap() {
    this._stackItem.isNoWrap = false;
  }
  _getCombinedWordTransformer() {
    const wt = this._wordTransformer ? (str) => applyTransformer(str, this._wordTransformer) : undefined;
    const ce = this.options.encodeCharacters;
    return wt ? ce ? (str) => ce(wt(str)) : wt : ce;
  }
  _popStackItem() {
    const item = this._stackItem;
    this._stackItem = item.next;
    return item;
  }
  addLineBreak() {
    if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) {
      return;
    }
    if (this._stackItem.isPre) {
      this._stackItem.rawText += `
`;
    } else {
      this._stackItem.inlineTextBuilder.startNewLine();
    }
  }
  addWordBreakOpportunity() {
    if (this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem) {
      this._stackItem.inlineTextBuilder.wordBreakOpportunity = true;
    }
  }
  addInline(str, { noWordTransform = false } = {}) {
    if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) {
      return;
    }
    if (this._stackItem.isPre) {
      this._stackItem.rawText += str;
      return;
    }
    if (str.length === 0 || this._stackItem.stashedLineBreaks && !this.whitespaceProcessor.testContainsWords(str)) {
      return;
    }
    if (this.options.preserveNewlines) {
      const newlinesNumber = this.whitespaceProcessor.countNewlinesNoWords(str);
      if (newlinesNumber > 0) {
        this._stackItem.inlineTextBuilder.startNewLine(newlinesNumber);
        return;
      }
    }
    if (this._stackItem.stashedLineBreaks) {
      this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
    }
    this.whitespaceProcessor.shrinkWrapAdd(str, this._stackItem.inlineTextBuilder, noWordTransform ? undefined : this._getCombinedWordTransformer(), this._stackItem.isNoWrap);
    this._stackItem.stashedLineBreaks = 0;
  }
  addLiteral(str) {
    if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) {
      return;
    }
    if (str.length === 0) {
      return;
    }
    if (this._stackItem.isPre) {
      this._stackItem.rawText += str;
      return;
    }
    if (this._stackItem.stashedLineBreaks) {
      this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
    }
    this.whitespaceProcessor.addLiteral(str, this._stackItem.inlineTextBuilder, this._stackItem.isNoWrap);
    this._stackItem.stashedLineBreaks = 0;
  }
  openBlock({ leadingLineBreaks = 1, reservedLineLength = 0, isPre = false } = {}) {
    const maxLineLength = Math.max(20, this._stackItem.inlineTextBuilder.maxLineLength - reservedLineLength);
    this._stackItem = new BlockStackItem(this.options, this._stackItem, leadingLineBreaks, maxLineLength);
    if (isPre) {
      this._stackItem.isPre = true;
    }
  }
  closeBlock({ trailingLineBreaks = 1, blockTransform = undefined } = {}) {
    const block = this._popStackItem();
    const blockText = blockTransform ? blockTransform(getText(block)) : getText(block);
    addText(this._stackItem, blockText, block.leadingLineBreaks, Math.max(block.stashedLineBreaks, trailingLineBreaks));
  }
  openList({ maxPrefixLength = 0, prefixAlign = "left", interRowLineBreaks = 1, leadingLineBreaks = 2 } = {}) {
    this._stackItem = new ListStackItem(this.options, this._stackItem, {
      interRowLineBreaks,
      leadingLineBreaks,
      maxLineLength: this._stackItem.inlineTextBuilder.maxLineLength,
      maxPrefixLength,
      prefixAlign
    });
  }
  openListItem({ prefix = "" } = {}) {
    if (!(this._stackItem instanceof ListStackItem)) {
      throw new Error("Can't add a list item to something that is not a list! Check the formatter.");
    }
    const list = this._stackItem;
    const prefixLength = Math.max(prefix.length, list.maxPrefixLength);
    const maxLineLength = Math.max(20, list.inlineTextBuilder.maxLineLength - prefixLength);
    this._stackItem = new ListItemStackItem(this.options, list, {
      prefix,
      maxLineLength,
      leadingLineBreaks: list.interRowLineBreaks
    });
  }
  closeListItem() {
    const listItem = this._popStackItem();
    const list = listItem.next;
    const prefixLength = Math.max(listItem.prefix.length, list.maxPrefixLength);
    const spacing = `
` + " ".repeat(prefixLength);
    const prefix = list.prefixAlign === "right" ? listItem.prefix.padStart(prefixLength) : listItem.prefix.padEnd(prefixLength);
    const text = prefix + getText(listItem).replace(/\n/g, spacing);
    addText(list, text, listItem.leadingLineBreaks, Math.max(listItem.stashedLineBreaks, list.interRowLineBreaks));
  }
  closeList({ trailingLineBreaks = 2 } = {}) {
    const list = this._popStackItem();
    const text = getText(list);
    if (text) {
      addText(this._stackItem, text, list.leadingLineBreaks, trailingLineBreaks);
    }
  }
  openTable() {
    this._stackItem = new TableStackItem(this._stackItem);
  }
  openTableRow() {
    if (!(this._stackItem instanceof TableStackItem)) {
      throw new Error("Can't add a table row to something that is not a table! Check the formatter.");
    }
    this._stackItem = new TableRowStackItem(this._stackItem);
  }
  openTableCell({ maxColumnWidth = undefined } = {}) {
    if (!(this._stackItem instanceof TableRowStackItem)) {
      throw new Error("Can't add a table cell to something that is not a table row! Check the formatter.");
    }
    this._stackItem = new TableCellStackItem(this.options, this._stackItem, maxColumnWidth);
  }
  closeTableCell({ colspan = 1, rowspan = 1 } = {}) {
    const cell = this._popStackItem();
    const text = trimCharacter(getText(cell), `
`);
    cell.next.cells.push({ colspan, rowspan, text });
  }
  closeTableRow() {
    const row = this._popStackItem();
    row.next.rows.push(row.cells);
  }
  closeTable({ tableToString, leadingLineBreaks = 2, trailingLineBreaks = 2 }) {
    const table = this._popStackItem();
    const output = tableToString(table.rows);
    if (output) {
      addText(this._stackItem, output, leadingLineBreaks, trailingLineBreaks);
    }
  }
  toString() {
    return getText(this._stackItem.getRoot());
  }
}
function getText(stackItem) {
  if (!(stackItem instanceof BlockStackItem || stackItem instanceof ListItemStackItem || stackItem instanceof TableCellStackItem)) {
    throw new Error("Only blocks, list items and table cells can be requested for text contents.");
  }
  return stackItem.inlineTextBuilder.isEmpty() ? stackItem.rawText : stackItem.rawText + stackItem.inlineTextBuilder.toString();
}
function addText(stackItem, text, leadingLineBreaks, trailingLineBreaks) {
  if (!(stackItem instanceof BlockStackItem || stackItem instanceof ListItemStackItem || stackItem instanceof TableCellStackItem)) {
    throw new Error("Only blocks, list items and table cells can contain text.");
  }
  const parentText = getText(stackItem);
  const lineBreaks = Math.max(stackItem.stashedLineBreaks, leadingLineBreaks);
  stackItem.inlineTextBuilder.clear();
  if (parentText) {
    stackItem.rawText = parentText + `
`.repeat(lineBreaks) + text;
  } else {
    stackItem.rawText = text;
    stackItem.leadingLineBreaks = lineBreaks;
  }
  stackItem.stashedLineBreaks = trailingLineBreaks;
}
function applyTransformer(str, transformer) {
  return transformer ? applyTransformer(transformer.transform(str), transformer.next) : str;
}
function compile$1(options = {}) {
  const selectorsWithoutFormat = options.selectors.filter((s2) => !s2.format);
  if (selectorsWithoutFormat.length) {
    throw new Error("Following selectors have no specified format: " + selectorsWithoutFormat.map((s2) => `\`${s2.selector}\``).join(", "));
  }
  const picker = new DecisionTree(options.selectors.map((s2) => [s2.selector, s2])).build(hp2Builder);
  if (typeof options.encodeCharacters !== "function") {
    options.encodeCharacters = makeReplacerFromDict(options.encodeCharacters);
  }
  const baseSelectorsPicker = new DecisionTree(options.baseElements.selectors.map((s2, i) => [s2, i + 1])).build(hp2Builder);
  function findBaseElements(dom) {
    return findBases(dom, options, baseSelectorsPicker);
  }
  const limitedWalk = limitedDepthRecursive(options.limits.maxDepth, recursiveWalk, function(dom, builder) {
    builder.addInline(options.limits.ellipsis || "");
  });
  return function(html, metadata = undefined) {
    return process(html, metadata, options, picker, findBaseElements, limitedWalk);
  };
}
function process(html, metadata, options, picker, findBaseElements, walk) {
  const maxInputLength = options.limits.maxInputLength;
  if (maxInputLength && html && html.length > maxInputLength) {
    console.warn(`Input length ${html.length} is above allowed limit of ${maxInputLength}. Truncating without ellipsis.`);
    html = html.substring(0, maxInputLength);
  }
  const document2 = parseDocument(html, { decodeEntities: options.decodeEntities });
  const bases = findBaseElements(document2.children);
  const builder = new BlockTextBuilder(options, picker, metadata);
  walk(bases, builder);
  return builder.toString();
}
function findBases(dom, options, baseSelectorsPicker) {
  const results = [];
  function recursiveWalk(walk, dom2) {
    dom2 = dom2.slice(0, options.limits.maxChildNodes);
    for (const elem of dom2) {
      if (elem.type !== "tag") {
        continue;
      }
      const pickedSelectorIndex = baseSelectorsPicker.pick1(elem);
      if (pickedSelectorIndex > 0) {
        results.push({ selectorIndex: pickedSelectorIndex, element: elem });
      } else if (elem.children) {
        walk(elem.children);
      }
      if (results.length >= options.limits.maxBaseElements) {
        return;
      }
    }
  }
  const limitedWalk = limitedDepthRecursive(options.limits.maxDepth, recursiveWalk);
  limitedWalk(dom);
  if (options.baseElements.orderBy !== "occurrence") {
    results.sort((a, b) => a.selectorIndex - b.selectorIndex);
  }
  return options.baseElements.returnDomByDefault && results.length === 0 ? dom : results.map((x) => x.element);
}
function recursiveWalk(walk, dom, builder) {
  if (!dom) {
    return;
  }
  const options = builder.options;
  const tooManyChildNodes = dom.length > options.limits.maxChildNodes;
  if (tooManyChildNodes) {
    dom = dom.slice(0, options.limits.maxChildNodes);
    dom.push({
      data: options.limits.ellipsis,
      type: "text"
    });
  }
  for (const elem of dom) {
    switch (elem.type) {
      case "text": {
        builder.addInline(elem.data);
        break;
      }
      case "tag": {
        const tagDefinition = builder.picker.pick1(elem);
        const format = options.formatters[tagDefinition.format];
        format(elem, walk, builder, tagDefinition.options || {});
        break;
      }
    }
  }
  return;
}
function makeReplacerFromDict(dict) {
  if (!dict || Object.keys(dict).length === 0) {
    return;
  }
  const entries = Object.entries(dict).filter(([, v]) => v !== false);
  const regex = new RegExp(entries.map(([c2]) => `(${unicodeEscape([...c2][0])})`).join("|"), "g");
  const values = entries.map(([, v]) => v);
  const replacer = (m, ...cgs) => values[cgs.findIndex((cg) => cg)];
  return (str) => str.replace(regex, replacer);
}
function formatSkip(elem, walk, builder, formatOptions) {}
function formatInlineString(elem, walk, builder, formatOptions) {
  builder.addLiteral(formatOptions.string || "");
}
function formatBlockString(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.addLiteral(formatOptions.string || "");
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatInline(elem, walk, builder, formatOptions) {
  walk(elem.children, builder);
}
function formatBlock$1(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  walk(elem.children, builder);
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function renderOpenTag(elem) {
  const attrs = elem.attribs && elem.attribs.length ? " " + Object.entries(elem.attribs).map(([k, v]) => v === "" ? k : `${k}=${v.replace(/"/g, "&quot;")}`).join(" ") : "";
  return `<${elem.name}${attrs}>`;
}
function renderCloseTag(elem) {
  return `</${elem.name}>`;
}
function formatInlineTag(elem, walk, builder, formatOptions) {
  builder.startNoWrap();
  builder.addLiteral(renderOpenTag(elem));
  builder.stopNoWrap();
  walk(elem.children, builder);
  builder.startNoWrap();
  builder.addLiteral(renderCloseTag(elem));
  builder.stopNoWrap();
}
function formatBlockTag(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.startNoWrap();
  builder.addLiteral(renderOpenTag(elem));
  builder.stopNoWrap();
  walk(elem.children, builder);
  builder.startNoWrap();
  builder.addLiteral(renderCloseTag(elem));
  builder.stopNoWrap();
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatInlineHtml(elem, walk, builder, formatOptions) {
  builder.startNoWrap();
  builder.addLiteral(render(elem, { decodeEntities: builder.options.decodeEntities }));
  builder.stopNoWrap();
}
function formatBlockHtml(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.startNoWrap();
  builder.addLiteral(render(elem, { decodeEntities: builder.options.decodeEntities }));
  builder.stopNoWrap();
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatInlineSurround(elem, walk, builder, formatOptions) {
  builder.addLiteral(formatOptions.prefix || "");
  walk(elem.children, builder);
  builder.addLiteral(formatOptions.suffix || "");
}
var genericFormatters = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  block: formatBlock$1,
  blockHtml: formatBlockHtml,
  blockString: formatBlockString,
  blockTag: formatBlockTag,
  inline: formatInline,
  inlineHtml: formatInlineHtml,
  inlineString: formatInlineString,
  inlineSurround: formatInlineSurround,
  inlineTag: formatInlineTag,
  skip: formatSkip
});
function getRow(matrix, j) {
  if (!matrix[j]) {
    matrix[j] = [];
  }
  return matrix[j];
}
function findFirstVacantIndex(row, x = 0) {
  while (row[x]) {
    x++;
  }
  return x;
}
function transposeInPlace(matrix, maxSize) {
  for (let i = 0;i < maxSize; i++) {
    const rowI = getRow(matrix, i);
    for (let j = 0;j < i; j++) {
      const rowJ = getRow(matrix, j);
      if (rowI[j] || rowJ[i]) {
        const temp = rowI[j];
        rowI[j] = rowJ[i];
        rowJ[i] = temp;
      }
    }
  }
}
function putCellIntoLayout(cell, layout, baseRow, baseCol) {
  for (let r2 = 0;r2 < cell.rowspan; r2++) {
    const layoutRow = getRow(layout, baseRow + r2);
    for (let c2 = 0;c2 < cell.colspan; c2++) {
      layoutRow[baseCol + c2] = cell;
    }
  }
}
function getOrInitOffset(offsets, index) {
  if (offsets[index] === undefined) {
    offsets[index] = index === 0 ? 0 : 1 + getOrInitOffset(offsets, index - 1);
  }
  return offsets[index];
}
function updateOffset(offsets, base, span, value) {
  offsets[base + span] = Math.max(getOrInitOffset(offsets, base + span), getOrInitOffset(offsets, base) + value);
}
function tableToString(tableRows, rowSpacing, colSpacing) {
  const layout = [];
  let colNumber = 0;
  const rowNumber = tableRows.length;
  const rowOffsets = [0];
  for (let j = 0;j < rowNumber; j++) {
    const layoutRow = getRow(layout, j);
    const cells = tableRows[j];
    let x = 0;
    for (let i = 0;i < cells.length; i++) {
      const cell = cells[i];
      x = findFirstVacantIndex(layoutRow, x);
      putCellIntoLayout(cell, layout, j, x);
      x += cell.colspan;
      cell.lines = cell.text.split(`
`);
      const cellHeight = cell.lines.length;
      updateOffset(rowOffsets, j, cell.rowspan, cellHeight + rowSpacing);
    }
    colNumber = layoutRow.length > colNumber ? layoutRow.length : colNumber;
  }
  transposeInPlace(layout, rowNumber > colNumber ? rowNumber : colNumber);
  const outputLines = [];
  const colOffsets = [0];
  for (let x = 0;x < colNumber; x++) {
    let y = 0;
    let cell;
    const rowsInThisColumn = Math.min(rowNumber, layout[x].length);
    while (y < rowsInThisColumn) {
      cell = layout[x][y];
      if (cell) {
        if (!cell.rendered) {
          let cellWidth = 0;
          for (let j = 0;j < cell.lines.length; j++) {
            const line = cell.lines[j];
            const lineOffset = rowOffsets[y] + j;
            outputLines[lineOffset] = (outputLines[lineOffset] || "").padEnd(colOffsets[x]) + line;
            cellWidth = line.length > cellWidth ? line.length : cellWidth;
          }
          updateOffset(colOffsets, x, cell.colspan, cellWidth + colSpacing);
          cell.rendered = true;
        }
        y += cell.rowspan;
      } else {
        const lineOffset = rowOffsets[y];
        outputLines[lineOffset] = outputLines[lineOffset] || "";
        y++;
      }
    }
  }
  return outputLines.join(`
`);
}
function formatLineBreak(elem, walk, builder, formatOptions) {
  builder.addLineBreak();
}
function formatWbr(elem, walk, builder, formatOptions) {
  builder.addWordBreakOpportunity();
}
function formatHorizontalLine(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.addInline("-".repeat(formatOptions.length || builder.options.wordwrap || 40));
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatParagraph(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  walk(elem.children, builder);
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatPre(elem, walk, builder, formatOptions) {
  builder.openBlock({
    isPre: true,
    leadingLineBreaks: formatOptions.leadingLineBreaks || 2
  });
  walk(elem.children, builder);
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatHeading(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  if (formatOptions.uppercase !== false) {
    builder.pushWordTransform((str) => str.toUpperCase());
    walk(elem.children, builder);
    builder.popWordTransform();
  } else {
    walk(elem.children, builder);
  }
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}
function formatBlockquote(elem, walk, builder, formatOptions) {
  builder.openBlock({
    leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
    reservedLineLength: 2
  });
  walk(elem.children, builder);
  builder.closeBlock({
    trailingLineBreaks: formatOptions.trailingLineBreaks || 2,
    blockTransform: (str) => (formatOptions.trimEmptyLines !== false ? trimCharacter(str, `
`) : str).split(`
`).map((line) => "> " + line).join(`
`)
  });
}
function withBrackets(str, brackets) {
  if (!brackets) {
    return str;
  }
  const lbr = typeof brackets[0] === "string" ? brackets[0] : "[";
  const rbr = typeof brackets[1] === "string" ? brackets[1] : "]";
  return lbr + str + rbr;
}
function pathRewrite(path, rewriter, baseUrl, metadata, elem) {
  const modifiedPath = typeof rewriter === "function" ? rewriter(path, metadata, elem) : path;
  return modifiedPath[0] === "/" && baseUrl ? trimCharacterEnd(baseUrl, "/") + modifiedPath : modifiedPath;
}
function formatImage(elem, walk, builder, formatOptions) {
  const attribs = elem.attribs || {};
  const alt = attribs.alt ? attribs.alt : "";
  const src = !attribs.src ? "" : pathRewrite(attribs.src, formatOptions.pathRewrite, formatOptions.baseUrl, builder.metadata, elem);
  const text = !src ? alt : !alt ? withBrackets(src, formatOptions.linkBrackets) : alt + " " + withBrackets(src, formatOptions.linkBrackets);
  builder.addInline(text, { noWordTransform: true });
}
function formatAnchor(elem, walk, builder, formatOptions) {
  function getHref() {
    if (formatOptions.ignoreHref) {
      return "";
    }
    if (!elem.attribs || !elem.attribs.href) {
      return "";
    }
    let href2 = elem.attribs.href.replace(/^mailto:/, "");
    if (formatOptions.noAnchorUrl && href2[0] === "#") {
      return "";
    }
    href2 = pathRewrite(href2, formatOptions.pathRewrite, formatOptions.baseUrl, builder.metadata, elem);
    return href2;
  }
  const href = getHref();
  if (!href) {
    walk(elem.children, builder);
  } else {
    let text = "";
    builder.pushWordTransform((str) => {
      if (str) {
        text += str;
      }
      return str;
    });
    walk(elem.children, builder);
    builder.popWordTransform();
    const hideSameLink = formatOptions.hideLinkHrefIfSameAsText && href === text;
    if (!hideSameLink) {
      builder.addInline(!text ? href : " " + withBrackets(href, formatOptions.linkBrackets), { noWordTransform: true });
    }
  }
}
function formatList(elem, walk, builder, formatOptions, nextPrefixCallback) {
  const isNestedList = get(elem, ["parent", "name"]) === "li";
  let maxPrefixLength = 0;
  const listItems = (elem.children || []).filter((child) => child.type !== "text" || !/^\s*$/.test(child.data)).map(function(child) {
    if (child.name !== "li") {
      return { node: child, prefix: "" };
    }
    const prefix = isNestedList ? nextPrefixCallback().trimStart() : nextPrefixCallback();
    if (prefix.length > maxPrefixLength) {
      maxPrefixLength = prefix.length;
    }
    return { node: child, prefix };
  });
  if (!listItems.length) {
    return;
  }
  builder.openList({
    interRowLineBreaks: 1,
    leadingLineBreaks: isNestedList ? 1 : formatOptions.leadingLineBreaks || 2,
    maxPrefixLength,
    prefixAlign: "left"
  });
  for (const { node: node2, prefix } of listItems) {
    builder.openListItem({ prefix });
    walk([node2], builder);
    builder.closeListItem();
  }
  builder.closeList({ trailingLineBreaks: isNestedList ? 1 : formatOptions.trailingLineBreaks || 2 });
}
function formatUnorderedList(elem, walk, builder, formatOptions) {
  const prefix = formatOptions.itemPrefix || " * ";
  return formatList(elem, walk, builder, formatOptions, () => prefix);
}
function formatOrderedList(elem, walk, builder, formatOptions) {
  let nextIndex = Number(elem.attribs.start || "1");
  const indexFunction = getOrderedListIndexFunction(elem.attribs.type);
  const nextPrefixCallback = () => " " + indexFunction(nextIndex++) + ". ";
  return formatList(elem, walk, builder, formatOptions, nextPrefixCallback);
}
function getOrderedListIndexFunction(olType = "1") {
  switch (olType) {
    case "a":
      return (i) => numberToLetterSequence(i, "a");
    case "A":
      return (i) => numberToLetterSequence(i, "A");
    case "i":
      return (i) => numberToRoman(i).toLowerCase();
    case "I":
      return (i) => numberToRoman(i);
    case "1":
    default:
      return (i) => i.toString();
  }
}
function splitClassesAndIds(selectors) {
  const classes = [];
  const ids = [];
  for (const selector of selectors) {
    if (selector.startsWith(".")) {
      classes.push(selector.substring(1));
    } else if (selector.startsWith("#")) {
      ids.push(selector.substring(1));
    }
  }
  return { classes, ids };
}
function isDataTable(attr, tables) {
  if (tables === true) {
    return true;
  }
  if (!attr) {
    return false;
  }
  const { classes, ids } = splitClassesAndIds(tables);
  const attrClasses = (attr["class"] || "").split(" ");
  const attrIds = (attr["id"] || "").split(" ");
  return attrClasses.some((x) => classes.includes(x)) || attrIds.some((x) => ids.includes(x));
}
function formatTable(elem, walk, builder, formatOptions) {
  return isDataTable(elem.attribs, builder.options.tables) ? formatDataTable(elem, walk, builder, formatOptions) : formatBlock(elem, walk, builder, formatOptions);
}
function formatBlock(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks });
  walk(elem.children, builder);
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks });
}
function formatDataTable(elem, walk, builder, formatOptions) {
  builder.openTable();
  elem.children.forEach(walkTable);
  builder.closeTable({
    tableToString: (rows) => tableToString(rows, formatOptions.rowSpacing ?? 0, formatOptions.colSpacing ?? 3),
    leadingLineBreaks: formatOptions.leadingLineBreaks,
    trailingLineBreaks: formatOptions.trailingLineBreaks
  });
  function formatCell(cellNode) {
    const colspan = +get(cellNode, ["attribs", "colspan"]) || 1;
    const rowspan = +get(cellNode, ["attribs", "rowspan"]) || 1;
    builder.openTableCell({ maxColumnWidth: formatOptions.maxColumnWidth });
    walk(cellNode.children, builder);
    builder.closeTableCell({ colspan, rowspan });
  }
  function walkTable(elem2) {
    if (elem2.type !== "tag") {
      return;
    }
    const formatHeaderCell = formatOptions.uppercaseHeaderCells !== false ? (cellNode) => {
      builder.pushWordTransform((str) => str.toUpperCase());
      formatCell(cellNode);
      builder.popWordTransform();
    } : formatCell;
    switch (elem2.name) {
      case "thead":
      case "tbody":
      case "tfoot":
      case "center":
        elem2.children.forEach(walkTable);
        return;
      case "tr": {
        builder.openTableRow();
        for (const childOfTr of elem2.children) {
          if (childOfTr.type !== "tag") {
            continue;
          }
          switch (childOfTr.name) {
            case "th": {
              formatHeaderCell(childOfTr);
              break;
            }
            case "td": {
              formatCell(childOfTr);
              break;
            }
          }
        }
        builder.closeTableRow();
        break;
      }
    }
  }
}
var textFormatters = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  anchor: formatAnchor,
  blockquote: formatBlockquote,
  dataTable: formatDataTable,
  heading: formatHeading,
  horizontalLine: formatHorizontalLine,
  image: formatImage,
  lineBreak: formatLineBreak,
  orderedList: formatOrderedList,
  paragraph: formatParagraph,
  pre: formatPre,
  table: formatTable,
  unorderedList: formatUnorderedList,
  wbr: formatWbr
});
var DEFAULT_OPTIONS = {
  baseElements: {
    selectors: ["body"],
    orderBy: "selectors",
    returnDomByDefault: true
  },
  decodeEntities: true,
  encodeCharacters: {},
  formatters: {},
  limits: {
    ellipsis: "...",
    maxBaseElements: undefined,
    maxChildNodes: undefined,
    maxDepth: undefined,
    maxInputLength: 1 << 24
  },
  longWordSplit: {
    forceWrapOnLimit: false,
    wrapCharacters: []
  },
  preserveNewlines: false,
  selectors: [
    { selector: "*", format: "inline" },
    {
      selector: "a",
      format: "anchor",
      options: {
        baseUrl: null,
        hideLinkHrefIfSameAsText: false,
        ignoreHref: false,
        linkBrackets: ["[", "]"],
        noAnchorUrl: true
      }
    },
    { selector: "article", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    { selector: "aside", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    {
      selector: "blockquote",
      format: "blockquote",
      options: { leadingLineBreaks: 2, trailingLineBreaks: 2, trimEmptyLines: true }
    },
    { selector: "br", format: "lineBreak" },
    { selector: "div", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    { selector: "footer", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    { selector: "form", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    { selector: "h1", format: "heading", options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    { selector: "h2", format: "heading", options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    { selector: "h3", format: "heading", options: { leadingLineBreaks: 3, trailingLineBreaks: 2, uppercase: true } },
    { selector: "h4", format: "heading", options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    { selector: "h5", format: "heading", options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    { selector: "h6", format: "heading", options: { leadingLineBreaks: 2, trailingLineBreaks: 2, uppercase: true } },
    { selector: "header", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    {
      selector: "hr",
      format: "horizontalLine",
      options: { leadingLineBreaks: 2, length: undefined, trailingLineBreaks: 2 }
    },
    {
      selector: "img",
      format: "image",
      options: { baseUrl: null, linkBrackets: ["[", "]"] }
    },
    { selector: "main", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    { selector: "nav", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    {
      selector: "ol",
      format: "orderedList",
      options: { leadingLineBreaks: 2, trailingLineBreaks: 2 }
    },
    { selector: "p", format: "paragraph", options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
    { selector: "pre", format: "pre", options: { leadingLineBreaks: 2, trailingLineBreaks: 2 } },
    { selector: "section", format: "block", options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
    {
      selector: "table",
      format: "table",
      options: {
        colSpacing: 3,
        leadingLineBreaks: 2,
        maxColumnWidth: 60,
        rowSpacing: 0,
        trailingLineBreaks: 2,
        uppercaseHeaderCells: true
      }
    },
    {
      selector: "ul",
      format: "unorderedList",
      options: { itemPrefix: " * ", leadingLineBreaks: 2, trailingLineBreaks: 2 }
    },
    { selector: "wbr", format: "wbr" }
  ],
  tables: [],
  whitespaceCharacters: ` 	\r
\f​`,
  wordwrap: 80
};
var concatMerge = (acc, src, options) => [...acc, ...src];
var overwriteMerge = (acc, src, options) => [...src];
var selectorsMerge = (acc, src, options) => acc.some((s2) => typeof s2 === "object") ? concatMerge(acc, src) : overwriteMerge(acc, src);
function compile(options = {}) {
  options = import_deepmerge.default(DEFAULT_OPTIONS, options, {
    arrayMerge: overwriteMerge,
    customMerge: (key) => key === "selectors" ? selectorsMerge : undefined
  });
  options.formatters = Object.assign({}, genericFormatters, textFormatters, options.formatters);
  options.selectors = mergeDuplicatesPreferLast(options.selectors, (s2) => s2.selector);
  handleDeprecatedOptions(options);
  return compile$1(options);
}
function convert(html, options = {}, metadata = undefined) {
  return compile(options)(html, metadata);
}
function handleDeprecatedOptions(options) {
  if (options.tags) {
    const tagDefinitions = Object.entries(options.tags).map(([selector, definition]) => ({ ...definition, selector: selector || "*" }));
    options.selectors.push(...tagDefinitions);
    options.selectors = mergeDuplicatesPreferLast(options.selectors, (s2) => s2.selector);
  }
  function set(obj, path, value) {
    const valueKey = path.pop();
    for (const key of path) {
      let nested = obj[key];
      if (!nested) {
        nested = {};
        obj[key] = nested;
      }
      obj = nested;
    }
    obj[valueKey] = value;
  }
  if (options["baseElement"]) {
    const baseElement = options["baseElement"];
    set(options, ["baseElements", "selectors"], Array.isArray(baseElement) ? baseElement : [baseElement]);
  }
  if (options["returnDomByDefault"] !== undefined) {
    set(options, ["baseElements", "returnDomByDefault"], options["returnDomByDefault"]);
  }
  for (const definition of options.selectors) {
    if (definition.format === "anchor" && get(definition, ["options", "noLinkBrackets"])) {
      set(definition, ["options", "linkBrackets"], false);
    }
  }
}

// node_modules/fast-xml-parser/src/util.js
var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
var regexName = new RegExp("^" + nameRegexp + "$");
function getAllMatches(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    const len = match.length;
    for (let index = 0;index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
}
var isName = function(string) {
  const match = regexName.exec(string);
  return !(match === null || typeof match === "undefined");
};
function isExist(v) {
  return typeof v !== "undefined";
}

// node_modules/fast-xml-parser/src/validator.js
var defaultOptions = {
  allowBooleanAttributes: false,
  unpairedTags: []
};
function validate(xmlData, options) {
  options = Object.assign({}, defaultOptions, options);
  const tags = [];
  let tagFound = false;
  let reachedRoot = false;
  if (xmlData[0] === "\uFEFF") {
    xmlData = xmlData.substr(1);
  }
  for (let i = 0;i < xmlData.length; i++) {
    if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
      i += 2;
      i = readPI(xmlData, i);
      if (i.err)
        return i;
    } else if (xmlData[i] === "<") {
      let tagStartPos = i;
      i++;
      if (xmlData[i] === "!") {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        let closingTag = false;
        if (xmlData[i] === "/") {
          closingTag = true;
          i++;
        }
        let tagName = "";
        for (;i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "\t" && xmlData[i] !== `
` && xmlData[i] !== "\r"; i++) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        if (tagName[tagName.length - 1] === "/") {
          tagName = tagName.substring(0, tagName.length - 1);
          i--;
        }
        if (!validateTagName(tagName)) {
          let msg;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '" + tagName + "' is an invalid name.";
          }
          return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
        }
        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
        }
        let attrStr = result.value;
        i = result.index;
        if (attrStr[attrStr.length - 1] === "/") {
          const attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
          } else {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else if (tags.length === 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject("InvalidTag", "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.", getLineNumberForPosition(xmlData, tagStartPos));
            }
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
          }
          if (reachedRoot === true) {
            return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
          } else if (options.unpairedTags.indexOf(tagName) !== -1) {} else {
            tags.push({ tagName, tagStartPos });
          }
          tagFound = true;
        }
        for (i++;i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            if (xmlData[i + 1] === "!") {
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i + 1] === "?") {
              i = readPI(xmlData, ++i);
              if (i.err)
                return i;
            } else {
              break;
            }
          } else if (xmlData[i] === "&") {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          } else {
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
            }
          }
        }
        if (xmlData[i] === "<") {
          i--;
        }
      }
    } else {
      if (isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }
  if (!tagFound) {
    return getErrorObject("InvalidXml", "Start tag expected.", 1);
  } else if (tags.length == 1) {
    return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  } else if (tags.length > 0) {
    return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t2) => t2.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
  }
  return true;
}
function isWhiteSpace(char) {
  return char === " " || char === "\t" || char === `
` || char === "\r";
}
function readPI(xmlData, i) {
  const start = i;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] == "?" || xmlData[i] == " ") {
      const tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === "xml") {
        return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
      } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}
function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
    for (i += 3;i < xmlData.length; i++) {
      if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
    let angleBracketsCount = 1;
    for (i += 8;i < xmlData.length; i++) {
      if (xmlData[i] === "<") {
        angleBracketsCount++;
      } else if (xmlData[i] === ">") {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
    for (i += 8;i < xmlData.length; i++) {
      if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  }
  return i;
}
var doubleQuote = '"';
var singleQuote = "'";
function readAttributeStr(xmlData, i) {
  let attrStr = "";
  let startChar = "";
  let tagClosed = false;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === "") {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) {} else {
        startChar = "";
      }
    } else if (xmlData[i] === ">") {
      if (startChar === "") {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== "") {
    return false;
  }
  return {
    value: attrStr,
    index: i,
    tagClosed
  };
}
var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
function validateAttributeString(attrStr, options) {
  const matches = getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};
  for (let i = 0;i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] !== undefined && matches[i][4] === undefined) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
    }
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!attrNames.hasOwnProperty(attrName)) {
      attrNames[attrName] = 1;
    } else {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
    }
  }
  return true;
}
function validateNumberAmpersand(xmlData, i) {
  let re = /\d/;
  if (xmlData[i] === "x") {
    i++;
    re = /[\da-fA-F]/;
  }
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === ";")
      return i;
    if (!xmlData[i].match(re))
      break;
  }
  return -1;
}
function validateAmpersand(xmlData, i) {
  i++;
  if (xmlData[i] === ";")
    return -1;
  if (xmlData[i] === "#") {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (;i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20)
      continue;
    if (xmlData[i] === ";")
      break;
    return -1;
  }
  return i;
}
function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col
    }
  };
}
function validateAttrName(attrName) {
  return isName(attrName);
}
function validateTagName(tagname) {
  return isName(tagname);
}
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,
    col: lines[lines.length - 1].length + 1
  };
}
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}

// node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var defaultOptions2 = {
  preserveOrder: false,
  attributeNamePrefix: "@_",
  attributesGroupName: false,
  textNodeName: "#text",
  ignoreAttributes: true,
  removeNSPrefix: false,
  allowBooleanAttributes: false,
  parseTagValue: true,
  parseAttributeValue: false,
  trimValues: true,
  cdataPropName: false,
  numberParseOptions: {
    hex: true,
    leadingZeros: true,
    eNotation: true
  },
  tagValueProcessor: function(tagName, val) {
    return val;
  },
  attributeValueProcessor: function(attrName, val) {
    return val;
  },
  stopNodes: [],
  alwaysCreateTextNode: false,
  isArray: () => false,
  commentPropName: false,
  unpairedTags: [],
  processEntities: true,
  htmlEntities: false,
  ignoreDeclaration: false,
  ignorePiTags: false,
  transformTagName: false,
  transformAttributeName: false,
  updateTag: function(tagName, jPath, attrs) {
    return tagName;
  },
  captureMetaData: false
};
var buildOptions = function(options) {
  return Object.assign({}, defaultOptions2, options);
};

// node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var METADATA_SYMBOL;
if (typeof Symbol !== "function") {
  METADATA_SYMBOL = "@@xmlMetadata";
} else {
  METADATA_SYMBOL = Symbol("XML Node Metadata");
}

class XmlNode {
  constructor(tagname) {
    this.tagname = tagname;
    this.child = [];
    this[":@"] = {};
  }
  add(key, val) {
    if (key === "__proto__")
      key = "#__proto__";
    this.child.push({ [key]: val });
  }
  addChild(node2, startIndex) {
    if (node2.tagname === "__proto__")
      node2.tagname = "#__proto__";
    if (node2[":@"] && Object.keys(node2[":@"]).length > 0) {
      this.child.push({ [node2.tagname]: node2.child, [":@"]: node2[":@"] });
    } else {
      this.child.push({ [node2.tagname]: node2.child });
    }
    if (startIndex !== undefined) {
      this.child[this.child.length - 1][METADATA_SYMBOL] = { startIndex };
    }
  }
  static getMetaDataSymbol() {
    return METADATA_SYMBOL;
  }
}

// node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
function readDocType(xmlData, i) {
  const entities = {};
  if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
    i = i + 9;
    let angleBracketsCount = 1;
    let hasBody = false, comment = false;
    let exp = "";
    for (;i < xmlData.length; i++) {
      if (xmlData[i] === "<" && !comment) {
        if (hasBody && isEntity(xmlData, i)) {
          i += 7;
          let entityName, val;
          [entityName, val, i] = readEntityExp(xmlData, i + 1);
          if (val.indexOf("&") === -1)
            entities[validateEntityName(entityName)] = {
              regx: RegExp(`&${entityName};`, "g"),
              val
            };
        } else if (hasBody && isElement(xmlData, i))
          i += 8;
        else if (hasBody && isAttlist(xmlData, i))
          i += 8;
        else if (hasBody && isNotation(xmlData, i))
          i += 9;
        else if (isComment2)
          comment = true;
        else
          throw new Error("Invalid DOCTYPE");
        angleBracketsCount++;
        exp = "";
      } else if (xmlData[i] === ">") {
        if (comment) {
          if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
            comment = false;
            angleBracketsCount--;
          }
        } else {
          angleBracketsCount--;
        }
        if (angleBracketsCount === 0) {
          break;
        }
      } else if (xmlData[i] === "[") {
        hasBody = true;
      } else {
        exp += xmlData[i];
      }
    }
    if (angleBracketsCount !== 0) {
      throw new Error(`Unclosed DOCTYPE`);
    }
  } else {
    throw new Error(`Invalid Tag instead of DOCTYPE`);
  }
  return { entities, i };
}
function readEntityExp(xmlData, i) {
  let entityName = "";
  for (;i < xmlData.length && (xmlData[i] !== "'" && xmlData[i] !== '"'); i++) {
    entityName += xmlData[i];
  }
  entityName = entityName.trim();
  if (entityName.indexOf(" ") !== -1)
    throw new Error("External entites are not supported");
  const startChar = xmlData[i++];
  let val = "";
  for (;i < xmlData.length && xmlData[i] !== startChar; i++) {
    val += xmlData[i];
  }
  return [entityName, val, i];
}
function isComment2(xmlData, i) {
  if (xmlData[i + 1] === "!" && xmlData[i + 2] === "-" && xmlData[i + 3] === "-")
    return true;
  return false;
}
function isEntity(xmlData, i) {
  if (xmlData[i + 1] === "!" && xmlData[i + 2] === "E" && xmlData[i + 3] === "N" && xmlData[i + 4] === "T" && xmlData[i + 5] === "I" && xmlData[i + 6] === "T" && xmlData[i + 7] === "Y")
    return true;
  return false;
}
function isElement(xmlData, i) {
  if (xmlData[i + 1] === "!" && xmlData[i + 2] === "E" && xmlData[i + 3] === "L" && xmlData[i + 4] === "E" && xmlData[i + 5] === "M" && xmlData[i + 6] === "E" && xmlData[i + 7] === "N" && xmlData[i + 8] === "T")
    return true;
  return false;
}
function isAttlist(xmlData, i) {
  if (xmlData[i + 1] === "!" && xmlData[i + 2] === "A" && xmlData[i + 3] === "T" && xmlData[i + 4] === "T" && xmlData[i + 5] === "L" && xmlData[i + 6] === "I" && xmlData[i + 7] === "S" && xmlData[i + 8] === "T")
    return true;
  return false;
}
function isNotation(xmlData, i) {
  if (xmlData[i + 1] === "!" && xmlData[i + 2] === "N" && xmlData[i + 3] === "O" && xmlData[i + 4] === "T" && xmlData[i + 5] === "A" && xmlData[i + 6] === "T" && xmlData[i + 7] === "I" && xmlData[i + 8] === "O" && xmlData[i + 9] === "N")
    return true;
  return false;
}
function validateEntityName(name2) {
  if (isName(name2))
    return name2;
  else
    throw new Error(`Invalid entity name ${name2}`);
}

// node_modules/strnum/strnum.js
var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
var consider = {
  hex: true,
  leadingZeros: true,
  decimalPoint: ".",
  eNotation: true
};
function toNumber(str, options = {}) {
  options = Object.assign({}, consider, options);
  if (!str || typeof str !== "string")
    return str;
  let trimmedStr = str.trim();
  if (options.skipLike !== undefined && options.skipLike.test(trimmedStr))
    return str;
  else if (str === "0")
    return 0;
  else if (options.hex && hexRegex.test(trimmedStr)) {
    return parse_int(trimmedStr, 16);
  } else if (trimmedStr.search(/[eE]/) !== -1) {
    const notation = trimmedStr.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/);
    if (notation) {
      if (options.leadingZeros) {
        trimmedStr = (notation[1] || "") + notation[3];
      } else {
        if (notation[2] === "0" && notation[3][0] === ".") {} else {
          return str;
        }
      }
      return options.eNotation ? Number(trimmedStr) : str;
    } else {
      return str;
    }
  } else {
    const match = numRegex.exec(trimmedStr);
    if (match) {
      const sign = match[1];
      const leadingZeros = match[2];
      let numTrimmedByZeros = trimZeros(match[3]);
      if (!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".")
        return str;
      else if (!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".")
        return str;
      else if (options.leadingZeros && leadingZeros === str)
        return 0;
      else {
        const num = Number(trimmedStr);
        const numStr = "" + num;
        if (numStr.search(/[eE]/) !== -1) {
          if (options.eNotation)
            return num;
          else
            return str;
        } else if (trimmedStr.indexOf(".") !== -1) {
          if (numStr === "0" && numTrimmedByZeros === "")
            return num;
          else if (numStr === numTrimmedByZeros)
            return num;
          else if (sign && numStr === "-" + numTrimmedByZeros)
            return num;
          else
            return str;
        }
        if (leadingZeros) {
          return numTrimmedByZeros === numStr || sign + numTrimmedByZeros === numStr ? num : str;
        } else {
          return trimmedStr === numStr || trimmedStr === sign + numStr ? num : str;
        }
      }
    } else {
      return str;
    }
  }
}
function trimZeros(numStr) {
  if (numStr && numStr.indexOf(".") !== -1) {
    numStr = numStr.replace(/0+$/, "");
    if (numStr === ".")
      numStr = "0";
    else if (numStr[0] === ".")
      numStr = "0" + numStr;
    else if (numStr[numStr.length - 1] === ".")
      numStr = numStr.substr(0, numStr.length - 1);
    return numStr;
  }
  return numStr;
}
function parse_int(numStr, base) {
  if (parseInt)
    return parseInt(numStr, base);
  else if (Number.parseInt)
    return Number.parseInt(numStr, base);
  else if (window && window.parseInt)
    return window.parseInt(numStr, base);
  else
    throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}

// node_modules/fast-xml-parser/src/ignoreAttributes.js
function getIgnoreAttributesFn(ignoreAttributes) {
  if (typeof ignoreAttributes === "function") {
    return ignoreAttributes;
  }
  if (Array.isArray(ignoreAttributes)) {
    return (attrName) => {
      for (const pattern of ignoreAttributes) {
        if (typeof pattern === "string" && attrName === pattern) {
          return true;
        }
        if (pattern instanceof RegExp && pattern.test(attrName)) {
          return true;
        }
      }
    };
  }
  return () => false;
}

// node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
class OrderedObjParser {
  constructor(options) {
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.docTypeEntities = {};
    this.lastEntities = {
      apos: { regex: /&(apos|#39|#x27);/g, val: "'" },
      gt: { regex: /&(gt|#62|#x3E);/g, val: ">" },
      lt: { regex: /&(lt|#60|#x3C);/g, val: "<" },
      quot: { regex: /&(quot|#34|#x22);/g, val: '"' }
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
    this.htmlEntities = {
      space: { regex: /&(nbsp|#160);/g, val: " " },
      cent: { regex: /&(cent|#162);/g, val: "¢" },
      pound: { regex: /&(pound|#163);/g, val: "£" },
      yen: { regex: /&(yen|#165);/g, val: "¥" },
      euro: { regex: /&(euro|#8364);/g, val: "€" },
      copyright: { regex: /&(copy|#169);/g, val: "©" },
      reg: { regex: /&(reg|#174);/g, val: "®" },
      inr: { regex: /&(inr|#8377);/g, val: "₹" },
      num_dec: { regex: /&#([0-9]{1,7});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 10)) },
      num_hex: { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => String.fromCodePoint(Number.parseInt(str, 16)) }
    };
    this.addExternalEntities = addExternalEntities;
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
    this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
  }
}
function addExternalEntities(externalEntities) {
  const entKeys = Object.keys(externalEntities);
  for (let i = 0;i < entKeys.length; i++) {
    const ent = entKeys[i];
    this.lastEntities[ent] = {
      regex: new RegExp("&" + ent + ";", "g"),
      val: externalEntities[ent]
    };
  }
}
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
  if (val !== undefined) {
    if (this.options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if (val.length > 0) {
      if (!escapeEntities)
        val = this.replaceEntitiesValue(val);
      const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
      if (newval === null || newval === undefined) {
        return val;
      } else if (typeof newval !== typeof val || newval !== val) {
        return newval;
      } else if (this.options.trimValues) {
        return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
      } else {
        const trimmedVal = val.trim();
        if (trimmedVal === val) {
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        } else {
          return val;
        }
      }
    }
  }
}
function resolveNameSpace(tagname) {
  if (this.options.removeNSPrefix) {
    const tags = tagname.split(":");
    const prefix = tagname.charAt(0) === "/" ? "/" : "";
    if (tags[0] === "xmlns") {
      return "";
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}
var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
function buildAttributesMap(attrStr, jPath, tagName) {
  if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
    const matches = getAllMatches(attrStr, attrsRegx);
    const len = matches.length;
    const attrs = {};
    for (let i = 0;i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      if (this.ignoreAttributesFn(attrName, jPath)) {
        continue;
      }
      let oldVal = matches[i][4];
      let aName = this.options.attributeNamePrefix + attrName;
      if (attrName.length) {
        if (this.options.transformAttributeName) {
          aName = this.options.transformAttributeName(aName);
        }
        if (aName === "__proto__")
          aName = "#__proto__";
        if (oldVal !== undefined) {
          if (this.options.trimValues) {
            oldVal = oldVal.trim();
          }
          oldVal = this.replaceEntitiesValue(oldVal);
          const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
          if (newVal === null || newVal === undefined) {
            attrs[aName] = oldVal;
          } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
            attrs[aName] = newVal;
          } else {
            attrs[aName] = parseValue(oldVal, this.options.parseAttributeValue, this.options.numberParseOptions);
          }
        } else if (this.options.allowBooleanAttributes) {
          attrs[aName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (this.options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[this.options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs;
  }
}
var parseXml = function(xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, `
`);
  const xmlObj = new XmlNode("!xml");
  let currentNode = xmlObj;
  let textData = "";
  let jPath = "";
  for (let i = 0;i < xmlData.length; i++) {
    const ch = xmlData[i];
    if (ch === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
        let tagName = xmlData.substring(i + 2, closeIndex).trim();
        if (this.options.removeNSPrefix) {
          const colonIndex = tagName.indexOf(":");
          if (colonIndex !== -1) {
            tagName = tagName.substr(colonIndex + 1);
          }
        }
        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        if (currentNode) {
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
        }
        const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
        if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
          throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
        }
        let propIndex = 0;
        if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
          propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
          this.tagsNodeStack.pop();
        } else {
          propIndex = jPath.lastIndexOf(".");
        }
        jPath = jPath.substring(0, propIndex);
        currentNode = this.tagsNodeStack.pop();
        textData = "";
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        let tagData = readTagExp(xmlData, i, false, "?>");
        if (!tagData)
          throw new Error("Pi Tag is not closed.");
        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {} else {
          const childNode = new XmlNode(tagData.tagName);
          childNode.add(this.options.textNodeName, "");
          if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
          }
          this.addChild(currentNode, childNode, jPath, i);
        }
        i = tagData.closeIndex + 1;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
        if (this.options.commentPropName) {
          const comment = xmlData.substring(i + 4, endIndex - 2);
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
          currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
        }
        i = endIndex;
      } else if (xmlData.substr(i + 1, 2) === "!D") {
        const result = readDocType(xmlData, i);
        this.docTypeEntities = result.entities;
        i = result.i;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        const tagExp = xmlData.substring(i + 9, closeIndex);
        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
        if (val == undefined)
          val = "";
        if (this.options.cdataPropName) {
          currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
        } else {
          currentNode.add(this.options.textNodeName, val);
        }
        i = closeIndex + 2;
      } else {
        let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
        let tagName = result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;
        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        if (currentNode && textData) {
          if (currentNode.tagname !== "!xml") {
            textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
          }
        }
        const lastTag = currentNode;
        if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
          currentNode = this.tagsNodeStack.pop();
          jPath = jPath.substring(0, jPath.lastIndexOf("."));
        }
        if (tagName !== xmlObj.tagname) {
          jPath += jPath ? "." + tagName : tagName;
        }
        const startIndex = i;
        if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
          let tagContent = "";
          if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            } else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            i = result.closeIndex;
          } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
            i = result.closeIndex;
          } else {
            const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
            if (!result2)
              throw new Error(`Unexpected end of ${rawTagName}`);
            i = result2.i;
            tagContent = result2.tagContent;
          }
          const childNode = new XmlNode(tagName);
          if (tagName !== tagExp && attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
          }
          if (tagContent) {
            tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
          }
          jPath = jPath.substr(0, jPath.lastIndexOf("."));
          childNode.add(this.options.textNodeName, tagContent);
          this.addChild(currentNode, childNode, jPath, startIndex);
        } else {
          if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            } else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            const childNode = new XmlNode(tagName);
            if (tagName !== tagExp && attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            jPath = jPath.substr(0, jPath.lastIndexOf("."));
          } else {
            const childNode = new XmlNode(tagName);
            this.tagsNodeStack.push(currentNode);
            if (tagName !== tagExp && attrExpPresent) {
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath, startIndex);
            currentNode = childNode;
          }
          textData = "";
          i = closeIndex;
        }
      }
    } else {
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
};
function addChild(currentNode, childNode, jPath, startIndex) {
  if (!this.options.captureMetaData)
    startIndex = undefined;
  const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
  if (result === false) {} else if (typeof result === "string") {
    childNode.tagname = result;
    currentNode.addChild(childNode, startIndex);
  } else {
    currentNode.addChild(childNode, startIndex);
  }
}
var replaceEntitiesValue = function(val) {
  if (this.options.processEntities) {
    for (let entityName in this.docTypeEntities) {
      const entity = this.docTypeEntities[entityName];
      val = val.replace(entity.regx, entity.val);
    }
    for (let entityName in this.lastEntities) {
      const entity = this.lastEntities[entityName];
      val = val.replace(entity.regex, entity.val);
    }
    if (this.options.htmlEntities) {
      for (let entityName in this.htmlEntities) {
        const entity = this.htmlEntities[entityName];
        val = val.replace(entity.regex, entity.val);
      }
    }
    val = val.replace(this.ampEntity.regex, this.ampEntity.val);
  }
  return val;
};
function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
  if (textData) {
    if (isLeafNode === undefined)
      isLeafNode = currentNode.child.length === 0;
    textData = this.parseTextData(textData, currentNode.tagname, jPath, false, currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false, isLeafNode);
    if (textData !== undefined && textData !== "")
      currentNode.add(this.options.textNodeName, textData);
    textData = "";
  }
  return textData;
}
function isItStopNode(stopNodes, jPath, currentTagName) {
  const allNodesExp = "*." + currentTagName;
  for (const stopNodePath in stopNodes) {
    const stopNodeExp = stopNodes[stopNodePath];
    if (allNodesExp === stopNodeExp || jPath === stopNodeExp)
      return true;
  }
  return false;
}
function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
  let attrBoundary;
  let tagExp = "";
  for (let index = i;index < xmlData.length; index++) {
    let ch = xmlData[index];
    if (attrBoundary) {
      if (ch === attrBoundary)
        attrBoundary = "";
    } else if (ch === '"' || ch === "'") {
      attrBoundary = ch;
    } else if (ch === closingChar[0]) {
      if (closingChar[1]) {
        if (xmlData[index + 1] === closingChar[1]) {
          return {
            data: tagExp,
            index
          };
        }
      } else {
        return {
          data: tagExp,
          index
        };
      }
    } else if (ch === "\t") {
      ch = " ";
    }
    tagExp += ch;
  }
}
function findClosingIndex(xmlData, str, i, errMsg) {
  const closingIndex = xmlData.indexOf(str, i);
  if (closingIndex === -1) {
    throw new Error(errMsg);
  } else {
    return closingIndex + str.length - 1;
  }
}
function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
  const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
  if (!result)
    return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if (separatorIndex !== -1) {
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }
  const rawTagName = tagName;
  if (removeNSPrefix) {
    const colonIndex = tagName.indexOf(":");
    if (colonIndex !== -1) {
      tagName = tagName.substr(colonIndex + 1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }
  return {
    tagName,
    tagExp,
    closeIndex,
    attrExpPresent,
    rawTagName
  };
}
function readStopNodeData(xmlData, tagName, i) {
  const startIndex = i;
  let openTagCount = 1;
  for (;i < xmlData.length; i++) {
    if (xmlData[i] === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
        let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
        if (closeTagName === tagName) {
          openTagCount--;
          if (openTagCount === 0) {
            return {
              tagContent: xmlData.substring(startIndex, i),
              i: closeIndex
            };
          }
        }
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
        i = closeIndex;
      } else {
        const tagData = readTagExp(xmlData, i, ">");
        if (tagData) {
          const openTagName = tagData && tagData.tagName;
          if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
            openTagCount++;
          }
          i = tagData.closeIndex;
        }
      }
    }
  }
}
function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === "string") {
    const newval = val.trim();
    if (newval === "true")
      return true;
    else if (newval === "false")
      return false;
    else
      return toNumber(val, options);
  } else {
    if (isExist(val)) {
      return val;
    } else {
      return "";
    }
  }
}

// node_modules/fast-xml-parser/src/xmlparser/node2json.js
var METADATA_SYMBOL2 = XmlNode.getMetaDataSymbol();
function prettify(node2, options) {
  return compress(node2, options);
}
function compress(arr, options, jPath) {
  let text;
  const compressedObj = {};
  for (let i = 0;i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName(tagObj);
    let newJpath = "";
    if (jPath === undefined)
      newJpath = property;
    else
      newJpath = jPath + "." + property;
    if (property === options.textNodeName) {
      if (text === undefined)
        text = tagObj[property];
      else
        text += "" + tagObj[property];
    } else if (property === undefined) {
      continue;
    } else if (tagObj[property]) {
      let val = compress(tagObj[property], options, newJpath);
      const isLeaf = isLeafTag(val, options);
      if (tagObj[METADATA_SYMBOL2] !== undefined) {
        val[METADATA_SYMBOL2] = tagObj[METADATA_SYMBOL2];
      }
      if (tagObj[":@"]) {
        assignAttributes(val, tagObj[":@"], newJpath, options);
      } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== undefined && !options.alwaysCreateTextNode) {
        val = val[options.textNodeName];
      } else if (Object.keys(val).length === 0) {
        if (options.alwaysCreateTextNode)
          val[options.textNodeName] = "";
        else
          val = "";
      }
      if (compressedObj[property] !== undefined && compressedObj.hasOwnProperty(property)) {
        if (!Array.isArray(compressedObj[property])) {
          compressedObj[property] = [compressedObj[property]];
        }
        compressedObj[property].push(val);
      } else {
        if (options.isArray(property, newJpath, isLeaf)) {
          compressedObj[property] = [val];
        } else {
          compressedObj[property] = val;
        }
      }
    }
  }
  if (typeof text === "string") {
    if (text.length > 0)
      compressedObj[options.textNodeName] = text;
  } else if (text !== undefined)
    compressedObj[options.textNodeName] = text;
  return compressedObj;
}
function propName(obj) {
  const keys = Object.keys(obj);
  for (let i = 0;i < keys.length; i++) {
    const key = keys[i];
    if (key !== ":@")
      return key;
  }
}
function assignAttributes(obj, attrMap, jpath, options) {
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length;
    for (let i = 0;i < len; i++) {
      const atrrName = keys[i];
      if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
        obj[atrrName] = [attrMap[atrrName]];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}
function isLeafTag(obj, options) {
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;
  if (propCount === 0) {
    return true;
  }
  if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
    return true;
  }
  return false;
}

// node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
class XMLParser {
  constructor(options) {
    this.externalEntities = {};
    this.options = buildOptions(options);
  }
  parse(xmlData, validationOption) {
    if (typeof xmlData === "string") {} else if (xmlData.toString) {
      xmlData = xmlData.toString();
    } else {
      throw new Error("XML data is accepted in String or Bytes[] form.");
    }
    if (validationOption) {
      if (validationOption === true)
        validationOption = {};
      const result = validate(xmlData, validationOption);
      if (result !== true) {
        throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
      }
    }
    const orderedObjParser = new OrderedObjParser(this.options);
    orderedObjParser.addExternalEntities(this.externalEntities);
    const orderedResult = orderedObjParser.parseXml(xmlData);
    if (this.options.preserveOrder || orderedResult === undefined)
      return orderedResult;
    else
      return prettify(orderedResult, this.options);
  }
  addEntity(key, value) {
    if (value.indexOf("&") !== -1) {
      throw new Error("Entity value can't have '&'");
    } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
      throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
    } else if (value === "&") {
      throw new Error("An entity with value '&' is not permitted");
    } else {
      this.externalEntities[key] = value;
    }
  }
  static getMetaDataSymbol() {
    return XmlNode.getMetaDataSymbol();
  }
}

// clientFhirUtils.ts
var MAX_CONCURRENCY = 5;
var MAX_FOLLOW_REFERENCES_DEPTH = 2;
var MAX_ATTACHMENT_SIZE_MB = 10;
var REQUEST_TIMEOUT_MS = 30000;

class ConcurrencyManager {
  limit;
  activeCount = 0;
  waitingQueue = [];
  constructor(limit) {
    this.limit = limit;
  }
  async acquire() {
    if (this.activeCount < this.limit) {
      this.activeCount++;
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        this.waitingQueue.push(() => {
          this.activeCount++;
          resolve();
        });
      });
    }
  }
  release() {
    this.activeCount--;
    if (this.waitingQueue.length > 0) {
      const nextResolve = this.waitingQueue.shift();
      if (nextResolve) {
        Promise.resolve().then(nextResolve);
      }
    }
  }
}
async function fetchWithTimeout(url, options, timeout = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController;
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout / 1000}s: ${url}`);
    }
    throw error;
  }
}
function findReferences(obj) {
  let refs = [];
  if (!obj || typeof obj !== "object")
    return refs;
  for (const key in obj) {
    if (key === "reference" && typeof obj[key] === "string" && obj[key].split("/").length === 2) {
      refs.push({ reference: obj[key] });
    } else if (typeof obj[key] === "object") {
      refs = refs.concat(findReferences(obj[key]));
    }
  }
  return import_lodash.default.uniqWith(refs, import_lodash.default.isEqual);
}
function findAttachments(obj, currentPath = "") {
  let attachments = [];
  if (!obj || typeof obj !== "object")
    return attachments;
  for (const key in obj) {
    if (!obj.hasOwnProperty(key))
      continue;
    const value = obj[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    if (typeof value === "object" && value !== null && value.contentType && (value.url || value.data)) {
      attachments.push({ attachment: value, path: newPath });
    } else if (typeof value === "object") {
      attachments = attachments.concat(findAttachments(value, newPath));
    }
  }
  return attachments;
}
function resolveReferenceUrl(reference, baseUrl) {
  try {
    if (reference.startsWith("http://") || reference.startsWith("https://")) {
      return reference;
    }
    const parts = reference.split("/");
    if (parts.length === 2 && parts[0] && parts[1]) {
      const base = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
      return `${base}${reference}`;
    }
    if (reference.startsWith("#")) {
      console.log(`Skipping internal contained resource reference: ${reference}`);
      return null;
    }
    console.warn(`Cannot resolve non-standard reference: ${reference}`);
    return null;
  } catch (e2) {
    console.error(`Error resolving reference URL (${reference}, ${baseUrl}):`, e2);
    return null;
  }
}
function isExpectedFetchFailure(error) {
  const status = error?.status;
  if (status === 403)
    return true;
  if (status === 400) {
    const message = error?.message || "";
    return /Unknown parameter|Invalid FHIR ID/i.test(message);
  }
  return false;
}
function extractTasksFromResource(resource, fhirBaseUrl, currentDepth) {
  const newTasks = [];
  if (!resource || typeof resource !== "object" || !resource.resourceType || !resource.id)
    return newTasks;
  if (currentDepth < MAX_FOLLOW_REFERENCES_DEPTH) {
    const references = findReferences(resource);
    for (const ref of references) {
      const url = resolveReferenceUrl(ref.reference, fhirBaseUrl);
      if (url) {
        newTasks.push({
          url,
          description: `Reference: ${ref.reference}`,
          depth: currentDepth + 1
        });
      }
    }
  }
  const attachments = findAttachments(resource);
  for (const { attachment, path } of attachments) {
    if (attachment.url && typeof attachment.url === "string") {
      if (!attachment.size || attachment.size <= MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
        const attachmentUrl = resolveReferenceUrl(attachment.url, fhirBaseUrl);
        if (attachmentUrl) {
          newTasks.push({
            url: attachmentUrl,
            description: `Attachment for ${resource.resourceType}/${resource.id}`,
            isAttachment: true,
            resourceType: resource.resourceType,
            resourceId: resource.id,
            attachmentPath: path,
            originalResourceJson: resource,
            depth: currentDepth
          });
        }
      } else {
        console.warn(`Skipping large attachment (${(attachment.size / 1024 / 1024).toFixed(1)} MB) for ${resource.resourceType}/${resource.id} at path ${path}`);
      }
    }
  }
  return newTasks;
}
function rtfToTextBestEffort(rtf) {
  if (!rtf) {
    return "";
  }
  try {
    let text = rtf.replace(/\{\\fonttbl.*?\}|\{\\colortbl.*?\}|\{\\stylesheet.*?\}|\{\\info.*?\}|\{\\operator.*?\}|\{\\pict.*?\}|\{\\object.*?\}|\{\\comment.*?\}|\{\\\*.*?\}|\pard\plain/gs, "");
    text = text.replace(/\\u(\d+)\s*\\\?\s?/g, (match, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch (e2) {
        console.warn(`[RTF] Invalid Unicode code point: ${dec}`);
        return "";
      }
    });
    text = text.replace(/\\'([0-9a-fA-F]{2})/g, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch (e2) {
        console.warn(`[RTF] Invalid hex escape: ${hex}`);
        return "";
      }
    });
    text = text.replace(/\\(par|pard|sect|page|line|ul)\b\s*/g, `
`);
    text = text.replace(/\\tab\b\s*/g, "\t");
    text = text.replace(/\\(bullet|emdash|endash|enspace|emspace)\b/g, (match, code) => {
      switch (code) {
        case "bullet":
          return "•";
        case "emdash":
          return "—";
        case "endash":
          return "–";
        case "enspace":
          return " ";
        case "emspace":
          return " ";
        default:
          return "";
      }
    });
    text = text.replace(/\\~ /g, " ");
    text = text.replace(/\\_/g, "");
    text = text.replace(/\\-/g, "-");
    text = text.replace(/\\\\\{/g, "{").replace(/\\\\\}/g, "}").replace(/\\\\\\\\/g, "\\");
    text = text.replace(/\\(\*?)[:\\w\-]+\d*\s?/g, "");
    text = text.replace(/\\[a-zA-Z]+(-?\d+)?\s?/g, "");
    text = text.replace(/[{}]/g, "");
    text = text.replace(/(\n\s*){2,}/g, `

`);
    text = text.replace(/[ \t]{2,}/g, " ");
    text = text.replace(/^\s+|\s+$/g, "");
    return text || "[Empty RTF content after processing]";
  } catch (error) {
    console.error("[RTF] Error during regex processing:", error);
    return "[Error processing RTF content]";
  }
}
function xmlToTextBestEffort(xmlContent) {
  try {
    const parser = new XMLParser({
      ignoreAttributes: true,
      textNodeName: "#text",
      trimValues: false,
      isArray: (name2, jpath, isLeafNode, isAttribute) => {
        return !isAttribute;
      }
    });
    const parsed = parser.parse(xmlContent);
    const extractText = (node2) => {
      let text = "";
      if (typeof node2 === "string") {
        text += node2;
      } else if (Array.isArray(node2)) {
        text += node2.map(extractText).join(`
`);
      } else if (typeof node2 === "object" && node2 !== null) {
        if (node2["#text"]) {
          text += node2["#text"];
        }
        text += Object.keys(node2).filter((key) => key !== "#text").map((key) => extractText(node2[key])).join(`
`);
      }
      return text;
    };
    let rawText = extractText(parsed);
    let cleanedText = rawText.replace(/[ \t]+/g, " ");
    cleanedText = cleanedText.replace(/\n+/g, `
`);
    const finalText = cleanedText.trim();
    return finalText || "[Empty XML content after processing]";
  } catch (xmlErr) {
    console.error(`[XML Parse] Error parsing XML content:`, xmlErr);
    return "[Error parsing XML]";
  }
}
async function processAttachmentData(fetchResultData, task, clientAttachments) {
  if (!task.isAttachment || !task.resourceType || !task.resourceId || !task.attachmentPath || !task.originalResourceJson) {
    console.warn("Skipping attachment processing due to missing task context", { task });
    return;
  }
  const originalAttachmentNode = import_lodash.default.get(task.originalResourceJson, task.attachmentPath);
  if (!originalAttachmentNode) {
    console.warn(`Could not find original attachment node at path ${task.attachmentPath} for ${task.resourceType}/${task.resourceId}`);
    return;
  }
  let contentBase64 = null;
  let contentPlaintext = null;
  const contentType = originalAttachmentNode.contentType || "application/octet-stream";
  const blob = fetchResultData;
  try {
    contentBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader;
      reader.onloadend = () => resolve(reader.result.split(",", 2)[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    if (contentType.startsWith("text/html")) {
      try {
        const htmlContent = await blob.text();
        contentPlaintext = convert(htmlContent, {
          wordwrap: false,
          selectors: [{ selector: "img", format: "skip" }]
        });
      } catch (htmlErr) {
        console.error(`[ATTACHMENT:HTML] HTML parsing error in ${task.resourceType}/${task.resourceId} at ${task.attachmentPath}:`, htmlErr);
        contentPlaintext = "[Error parsing HTML]";
      }
    } else if (contentType.includes("xml")) {
      try {
        const xmlContent = await blob.text();
        contentPlaintext = xmlToTextBestEffort(xmlContent);
      } catch (err) {
        console.error(`[ATTACHMENT:XML] Error reading or processing XML blob in ${task.resourceType}/${task.resourceId} at ${task.attachmentPath}:`, err);
        contentPlaintext = "[Error processing XML]";
      }
    } else if (contentType.startsWith("application/rtf") || contentType.startsWith("text/rtf")) {
      try {
        console.log(`[ATTACHMENT:RTF] Attempting best-effort RTF parsing for ${task.resourceType}/${task.resourceId} at ${task.attachmentPath}`);
        const rtfContent = await blob.text();
        contentPlaintext = rtfToTextBestEffort(rtfContent);
        if (!contentPlaintext)
          contentPlaintext = "[Empty RTF content after processing]";
      } catch (rtfErr) {
        console.error(`[ATTACHMENT:RTF] Error reading or processing RTF blob in ${task.resourceType}/${task.resourceId} at ${task.attachmentPath}:`, rtfErr);
        contentPlaintext = "[Error processing RTF]";
      }
    } else {
      contentPlaintext = await blob.text();
      console.log(`[ATTACHMENT:OTHER] Attachment ${task.resourceType}/${task.resourceId} at ${task.attachmentPath} has non-extractable type ${contentType}. default .text() plaintext generated.`);
    }
    const newAttachment = {
      resourceType: task.resourceType,
      resourceId: task.resourceId,
      path: task.attachmentPath,
      contentType,
      contentPlaintext,
      contentBase64,
      json: JSON.stringify(originalAttachmentNode)
    };
    const attachmentKey = `${newAttachment.resourceType}/${newAttachment.resourceId}#${newAttachment.path}`;
    if (!clientAttachments.some((a) => `${a.resourceType}/${a.resourceId}#${a.path}` === attachmentKey)) {
      clientAttachments.push(newAttachment);
    }
  } catch (error) {
    console.error(`Error processing attachment data for ${task.resourceType}/${task.resourceId} at ${task.attachmentPath}:`, error);
  }
}
function processInlineAttachments(clientFullEhr) {
  console.log("Processing inline attachments...");
  let processedCount = 0;
  for (const resourceType in clientFullEhr.fhir) {
    for (const resource of clientFullEhr.fhir[resourceType]) {
      const attachments = findAttachments(resource);
      for (const { attachment, path } of attachments) {
        if (attachment.data && !attachment.url && resource.id && resource.resourceType) {
          const alreadyProcessed = clientFullEhr.attachments.some((att) => att.resourceType === resource.resourceType && att.resourceId === resource.id && att.path === path);
          if (!alreadyProcessed) {
            let contentBase64 = attachment.data;
            let contentPlaintext = null;
            const contentType = attachment.contentType || "application/octet-stream";
            try {
              if (contentBase64) {
                let decodedText = null;
                try {
                  decodedText = Buffer.from(contentBase64, "base64").toString("utf8");
                } catch (decodeError) {
                  console.warn(`[INLINE:DECODE] Failed to decode base64 for inline attachment ${resource.resourceType}/${resource.id} at ${path}:`, decodeError);
                  contentPlaintext = "[Error decoding base64 data]";
                }
                if (decodedText !== null) {
                  if (contentType.startsWith("text/html")) {
                    try {
                      contentPlaintext = convert(decodedText, {
                        wordwrap: false,
                        selectors: [{ selector: "img", format: "skip" }]
                      });
                    } catch (htmlErr) {
                      console.error(`[INLINE:HTML] HTML parsing error for inline ${resource.resourceType}/${resource.id} at ${path}:`, htmlErr);
                      contentPlaintext = "[Error parsing inline HTML]";
                    }
                  } else if (contentType.includes("xml")) {
                    try {
                      contentPlaintext = xmlToTextBestEffort(decodedText);
                    } catch (xmlErr) {
                      console.error(`[INLINE:XML] XML parsing error for inline ${resource.resourceType}/${resource.id} at ${path}:`, xmlErr);
                      contentPlaintext = "[Error parsing inline XML]";
                    }
                  } else if (contentType.startsWith("text/") || contentType === "application/json" || contentType === "application/fhir+json") {
                    contentPlaintext = decodedText;
                  } else if (contentType.startsWith("application/rtf") || contentType.startsWith("text/rtf")) {
                    try {
                      console.log(`[INLINE:RTF] Attempting best-effort RTF parsing for inline ${resource.resourceType}/${resource.id} at ${path}`);
                      contentPlaintext = rtfToTextBestEffort(decodedText);
                      if (!contentPlaintext)
                        contentPlaintext = "[Empty inline RTF content after processing]";
                    } catch (rtfErr) {
                      console.error(`[INLINE:RTF] Error processing inline RTF in ${resource.resourceType}/${resource.id} at ${path}:`, rtfErr);
                      contentPlaintext = "[Error processing inline RTF]";
                    }
                  } else {
                    contentPlaintext = null;
                  }
                }
              }
              clientFullEhr.attachments.push({
                resourceType: resource.resourceType,
                resourceId: resource.id,
                path,
                contentType,
                contentPlaintext,
                contentBase64,
                json: JSON.stringify(attachment)
              });
              processedCount++;
            } catch (inlineError) {
              console.error(`Error processing inline attachment for ${resource.resourceType}/${resource.id} at ${path}:`, inlineError);
            }
          }
        }
      }
    }
  }
  console.log(`Finished processing ${processedCount} inline attachments.`);
}
async function fetchAllEhrDataClientSideParallel(accessToken, fhirBaseUrl, patientId, progressCallback) {
  const clientFullEhr = { fhir: {}, attachments: [] };
  const fetchedUrls = new Set;
  const pool = new ConcurrencyManager(MAX_CONCURRENCY);
  let completedFetches = 0;
  let totalTasks = 0;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/fhir+json, application/json, */*"
  };
  async function fetchAndProcessTask(task) {
    await pool.acquire();
    let discoveredTasks = [];
    let taskCompletedSuccessfully = false;
    let acceptHeader = "application/fhir+json, application/json, */*";
    if (task.isAttachment && task.originalResourceJson && task.attachmentPath) {
      const originalAttachmentNode = import_lodash.default.get(task.originalResourceJson, task.attachmentPath);
      if (originalAttachmentNode?.contentType) {
        acceptHeader = originalAttachmentNode.contentType;
        console.log(`Setting Accept header to "${acceptHeader}" for attachment: ${task.description}`);
      }
    }
    const currentHeaders = new Headers(headers);
    currentHeaders.set("Accept", acceptHeader);
    try {
      progressCallback(completedFetches, totalTasks, `Fetching: ${task.description}...`);
      const response = await fetchWithTimeout(task.url, { headers: currentHeaders }, REQUEST_TIMEOUT_MS);
      let resultData = null;
      let isJson = false;
      let isAttachmentBlob = false;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        resultData = await response.json();
        isJson = true;
      } else if (task.isAttachment) {
        resultData = await response.blob();
        isAttachmentBlob = true;
      } else {
        console.warn(`Unexpected content type (${contentType}) for ${task.url}, attempting text.`);
        resultData = await response.text();
      }
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status} for ${task.url}`;
        if (isJson && resultData?.issue?.[0]?.diagnostics) {
          errorMsg += `: ${resultData.issue[0].diagnostics}`;
        } else if (typeof resultData === "string") {
          errorMsg += `: ${resultData.substring(0, 100)}`;
        }
        const httpError = new Error(errorMsg);
        httpError.status = response.status;
        throw httpError;
      }
      if (isJson && resultData?.resourceType === "Bundle" && resultData.entry) {
        const entries = resultData.entry;
        for (const entry of entries) {
          if (entry.resource) {
            const res = entry.resource;
            if (res.resourceType && res.id) {
              if (!clientFullEhr.fhir[res.resourceType])
                clientFullEhr.fhir[res.resourceType] = [];
              if (!clientFullEhr.fhir[res.resourceType].some((r2) => r2.id === res.id)) {
                clientFullEhr.fhir[res.resourceType].push(res);
                discoveredTasks = discoveredTasks.concat(extractTasksFromResource(res, fhirBaseUrl, task.depth));
              }
            }
          }
        }
      } else if (task.isAttachment && isAttachmentBlob && resultData instanceof Blob) {
        await processAttachmentData(resultData, task, clientFullEhr.attachments);
      } else if (isJson && resultData?.resourceType && resultData.id) {
        const res = resultData;
        if (!clientFullEhr.fhir[res.resourceType])
          clientFullEhr.fhir[res.resourceType] = [];
        if (!clientFullEhr.fhir[res.resourceType].some((r2) => r2.id === res.id)) {
          clientFullEhr.fhir[res.resourceType].push(res);
          discoveredTasks = discoveredTasks.concat(extractTasksFromResource(res, fhirBaseUrl, task.depth));
        }
      } else {
        console.log(`Successfully fetched non-FHIR, non-attachment URL: ${task.url}`);
      }
      taskCompletedSuccessfully = true;
    } catch (error) {
      if (isExpectedFetchFailure(error)) {
        console.warn(`Skipped "${task.description}": ${error.message}`);
      } else {
        console.error(`Error processing task "${task.description}":`, error);
      }
    } finally {
      completedFetches++;
      const statusMsg = taskCompletedSuccessfully ? `Completed: ${task.description}` : `Failed: ${task.description}`;
      progressCallback(completedFetches, totalTasks, statusMsg);
      pool.release();
    }
    return discoveredTasks;
  }
  let currentTasks = [];
  const fhirBaseUrlWithSlash = fhirBaseUrl.endsWith("/") ? fhirBaseUrl : `${fhirBaseUrl}/`;
  const initialQueries = getInitialFhirSearchQueries(patientId);
  initialQueries.forEach((query) => {
    const params = new URLSearchParams(query.params);
    const url = `${fhirBaseUrlWithSlash}${query.resourceType}?${params.toString()}`;
    const normalizedUrl = url.replace(/\/$/, "");
    if (!fetchedUrls.has(normalizedUrl)) {
      fetchedUrls.add(normalizedUrl);
      const paramDesc = Object.entries(query.params || {}).filter(([key]) => key !== "patient").map(([key, value]) => `${key}=${value}`).join(", ");
      const description = `Initial ${query.resourceType}${paramDesc ? ` (${paramDesc})` : ""}`;
      currentTasks.push({ url, description, depth: 0 });
    }
  });
  const patientUrl = `${fhirBaseUrlWithSlash}Patient/${patientId}`;
  const normalizedPatientUrl = patientUrl.replace(/\/$/, "");
  if (!fetchedUrls.has(normalizedPatientUrl)) {
    fetchedUrls.add(normalizedPatientUrl);
    currentTasks.push({ url: patientUrl, description: "Patient Record", depth: 0 });
  }
  totalTasks = currentTasks.length;
  progressCallback(0, totalTasks, "Starting initial fetch batch...");
  if (totalTasks === 0) {
    console.warn("No initial tasks generated.");
    return clientFullEhr;
  }
  while (currentTasks.length > 0) {
    const batchDescription = `Batch of ${currentTasks.length} tasks`;
    console.log(`Starting ${batchDescription}...`);
    const promises = currentTasks.map((task) => fetchAndProcessTask(task));
    const results = await Promise.allSettled(promises);
    const nextBatchTasks = [];
    results.forEach((settledResult) => {
      if (settledResult.status === "fulfilled" && Array.isArray(settledResult.value)) {
        const newTasksFromResult = settledResult.value;
        for (const newTask of newTasksFromResult) {
          const normalizedUrl = newTask.url.replace(/\/$/, "");
          if (!fetchedUrls.has(normalizedUrl)) {
            fetchedUrls.add(normalizedUrl);
            nextBatchTasks.push(newTask);
            totalTasks++;
          }
        }
      }
    });
    console.log(`${batchDescription} finished. Found ${nextBatchTasks.length} new unique tasks.`);
    progressCallback(completedFetches, totalTasks, `${batchDescription} finished. Starting next...`);
    currentTasks = nextBatchTasks;
  }
  console.log(`All fetch batches completed. Final progress: ${completedFetches}/${totalTasks}`);
  progressCallback(completedFetches, totalTasks, "Processing inline data...");
  processInlineAttachments(clientFullEhr);
  progressCallback(completedFetches, totalTasks, "All fetching complete.");
  console.log(`Finished fetching. Resources: ${Object.keys(clientFullEhr.fhir).length} types, Attachments: ${clientFullEhr.attachments.length}`);
  console.log("Returning ClientFullEHR object from fetchAllEhrDataClientSideParallel.");
  return clientFullEhr;
}

// ehretriever.ts
var AUTH_STORAGE_KEY = "smart_auth_state";
var DELIVERY_TARGET_KEY = "delivery_target_name";
var OPENER_TARGET_VALUE = "__opener__";
var OPENER_TARGET_ORIGIN_KEY = "opener_target_origin";
var brandSelectorContainer;
var brandSearchInput;
var brandSearchSpinner;
var brandResultsContainer;
var brandModalBackdrop;
var brandModal;
var brandModalTitle;
var brandModalDetails;
var brandModalCancel;
var brandModalConnect;
var brandInitialLoadingMessage;
var statusContainer;
var statusMessageElement;
var progressContainer;
var progressBar;
var progressText;
var confirmationContainer;
var confirmationMessageElement;
var confirmSendBtn;
var cancelSendBtn;
var downloadDataBtn;
var allBrandItems = [];
var selectedBrandItem = null;
var currentBrandRenderAbortController = null;
var brandDebounceTimer = null;
var currentFilteredItems = [];
var currentPage = 1;
var ITEMS_PER_PAGE = 1200;
var brandPaginationControls;
var brandPrevBtn;
var brandNextBtn;
var brandPageInfo;
var RENDER_CHUNK_SIZE = 50;
var RENDER_DELAY = 0;
var DEBOUNCE_DELAY = 300;
function updateStatus(message, isError = false) {
  if (statusMessageElement) {
    statusMessageElement.textContent = message;
    statusMessageElement.style.color = isError ? "red" : "black";
  }
  console.log(`Status: ${message}`);
  if (isError) {
    console.error(`Status Error: ${message}`);
  }
}
function showStatusContainer(show) {
  const formContainer = document.getElementById("form-container");
  const statusContainer2 = document.getElementById("status-container");
  if (formContainer)
    formContainer.style.display = show ? "none" : "block";
  if (statusContainer2)
    statusContainer2.style.display = show ? "block" : "none";
}
function showProgressContainer(show) {
  const progressContainer2 = document.getElementById("progress-container");
  if (progressContainer2)
    progressContainer2.style.display = show ? "block" : "none";
}
function showConfirmationContainer(show) {
  const confirmationContainer2 = document.getElementById("confirmation-container");
  if (confirmationContainer2)
    confirmationContainer2.style.display = show ? "block" : "none";
}
function updateProgress(completed, total, message) {
  const progressBar2 = document.getElementById("fetch-progress");
  const progressText2 = document.getElementById("progress-text");
  if (progressBar2 && progressText2) {
    const percentage = total > 0 ? completed / total * 100 : 0;
    progressBar2.value = percentage;
    progressText2.textContent = `(${completed}/${total}) ${message || ""}`.trim();
    console.log(`Progress: ${completed}/${total} (${percentage.toFixed(1)}%) ${message || ""}`);
  }
  if (total > 0) {
    const progressContainer2 = document.getElementById("progress-container");
    if (progressContainer2 && progressContainer2.style.display === "none") {
      showProgressContainer(true);
    }
  }
  confirmationContainer = document.getElementById("confirmation-container");
  confirmationMessageElement = document.getElementById("confirmation-message");
  confirmSendBtn = document.getElementById("confirm-send-btn");
  cancelSendBtn = document.getElementById("cancel-send-btn");
}
function makeAbsoluteUrl(urlStr) {
  try {
    const absoluteUrl = new URL(urlStr, window.location.origin);
    return absoluteUrl.toString();
  } catch (e2) {
    console.error(`Error creating absolute URL from "${urlStr}":`, e2);
    return urlStr;
  }
}
async function fetchWithRetry(url, init = {}, attempts = 3) {
  let lastFailure = "";
  for (let attempt = 0;attempt < attempts; attempt++) {
    if (attempt > 0) {
      const delayMs = 400 * Math.pow(3, attempt - 1);
      updateStatus(`Connection problem; retrying (${attempt + 1} of ${attempts})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    try {
      const response = await fetch(url, init);
      if (response.status >= 500 && attempt < attempts - 1) {
        lastFailure = `${response.status} ${response.statusText}`;
        console.warn(`[fetchWithRetry] ${lastFailure} from ${url}; retrying.`);
        continue;
      }
      return response;
    } catch (err) {
      lastFailure = err?.message || String(err);
      console.warn(`[fetchWithRetry] Network failure for ${url}: ${lastFailure}`);
    }
  }
  let host = url;
  try {
    host = new URL(url).host;
  } catch {}
  throw new Error(`Could not reach ${host}. The server may be temporarily unavailable, or this ` + `organization's directory entry may be out of date.` + (lastFailure ? ` (${lastFailure})` : ""));
}
function generateRandomString(length = 40) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0;i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
var safeLower = (str) => str ? String(str).toLowerCase() : "";
function createBrandTileElement(item) {
  const tile = document.createElement("div");
  tile.className = "brand-tile";
  let detailsHTML = `<h3>${item.displayName}</h3>`;
  detailsHTML += `<p class="provider-info">Data Provider: ${item.brandName}</p>`;
  const hasCollapseInfo = typeof item._matchedCount === "number" && typeof item._totalCount === "number";
  if (!hasCollapseInfo && item.itemType === "facility") {
    const locationParts = [item.city, item.state, item.postalCode].filter(Boolean);
    if (locationParts.length > 0) {
      detailsHTML += `<p class="location-info">Location: ${locationParts.join(", ")}</p>`;
    }
  }
  if (hasCollapseInfo) {
    detailsHTML += `<p class="collapse-info">Matched ${item._matchedCount} of ${item._totalCount} card${item._totalCount !== 1 ? "s" : ""}</p>`;
  }
  tile.innerHTML = detailsHTML;
  tile.addEventListener("click", () => showBrandModal(item));
  return tile;
}
function collapseBrandItems(allItems, matchedItems, scoreMap) {
  const matchedSet = new Set(matchedItems);
  const grouped = {};
  allItems.forEach((itm) => {
    const key = itm.brandId || itm.brandName;
    if (!grouped[key])
      grouped[key] = [];
    grouped[key].push(itm);
  });
  const collapsed = [];
  for (const key in grouped) {
    const group = grouped[key];
    const matchedInGroup = group.filter((itm) => matchedSet.has(itm));
    const matchedCount = matchedInGroup.length;
    const totalCount = group.length;
    if (matchedCount === 0)
      continue;
    if (matchedCount === 1) {
      const single = matchedInGroup[0];
      const repCloneSingle = { ...single, _score: scoreMap.get(single) ?? 0 };
      delete repCloneSingle._matchedCount;
      delete repCloneSingle._totalCount;
      delete repCloneSingle._collapseCount;
      collapsed.push(repCloneSingle);
    } else {
      let representative = group.find((g) => g.itemType === "brand");
      if (!representative) {
        representative = matchedInGroup.slice().sort((a, b) => a.displayName.length - b.displayName.length)[0];
      }
      const bestScore = Math.min(...matchedInGroup.map((it) => scoreMap.get(it) ?? 0));
      const repClone = {
        ...representative,
        _score: bestScore,
        _matchedCount: matchedCount,
        _totalCount: totalCount
      };
      delete repClone._collapseCount;
      collapsed.push(repClone);
    }
  }
  return collapsed;
}
function renderBrandItemsInChunks(itemsToRender) {
  if (!brandResultsContainer || !brandSearchSpinner)
    return;
  if (currentBrandRenderAbortController) {
    currentBrandRenderAbortController.abort();
  }
  currentBrandRenderAbortController = new AbortController;
  const signal = currentBrandRenderAbortController.signal;
  if (brandResultsContainer)
    brandResultsContainer.innerHTML = "";
  if (itemsToRender.length === 0) {
    if (brandResultsContainer)
      brandResultsContainer.innerHTML = '<p class="brand-status-message">No matching organizations found.</p>';
    if (brandSearchSpinner)
      brandSearchSpinner.style.display = "none";
    return;
  }
  let currentIndex = 0;
  const fragment = document.createDocumentFragment();
  function renderNextChunk() {
    if (signal.aborted) {
      if (brandSearchSpinner)
        brandSearchSpinner.style.display = "none";
      return;
    }
    if (brandSearchSpinner)
      brandSearchSpinner.style.display = "block";
    const endTime = performance.now() + 16;
    let chunkCount = 0;
    while (performance.now() < endTime && currentIndex < itemsToRender.length) {
      fragment.appendChild(createBrandTileElement(itemsToRender[currentIndex]));
      currentIndex++;
      chunkCount++;
      if (chunkCount >= RENDER_CHUNK_SIZE)
        break;
    }
    if (brandResultsContainer)
      brandResultsContainer.appendChild(fragment);
    if (currentIndex < itemsToRender.length) {
      setTimeout(renderNextChunk, RENDER_DELAY);
    } else {
      if (brandSearchSpinner)
        brandSearchSpinner.style.display = "none";
      currentBrandRenderAbortController = null;
    }
  }
  renderNextChunk();
}
function renderCurrentPage() {
  if (!brandResultsContainer || !brandPaginationControls || !brandPrevBtn || !brandNextBtn || !brandPageInfo) {
    console.error("Cannot render page, pagination elements missing.");
    return;
  }
  const totalItems = currentFilteredItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  currentPage = Math.max(1, Math.min(currentPage, totalPages));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const itemsToDisplay = currentFilteredItems.slice(startIndex, endIndex);
  console.log(`Rendering page ${currentPage} of ${totalPages}. Items ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems}.`);
  renderBrandItemsInChunks(itemsToDisplay);
  brandPageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  brandPrevBtn.disabled = currentPage <= 1;
  brandNextBtn.disabled = currentPage >= totalPages;
  brandPaginationControls.style.display = totalPages > 1 ? "block" : "none";
}
function handleBrandSearch() {
  if (!brandSearchInput || !brandSearchSpinner)
    return;
  const searchTerm = brandSearchInput.value.toLowerCase().trim();
  const searchTokens = searchTerm.split(/[^\w\d]+/).filter((token2) => token2.length > 0);
  brandSearchSpinner.style.display = "block";
  const scoreMap = new Map;
  const searchFiltered = searchTokens.length === 0 ? allBrandItems : allBrandItems.filter((item) => {
    let cumulativeScore = 0;
    const matched = searchTokens.every((token2) => {
      const fieldsToSearch = [
        safeLower(item.displayName),
        safeLower(item.brandName),
        safeLower(item.city),
        safeLower(item.state),
        safeLower(item.postalCode)
      ];
      let bestPos = Infinity;
      for (const field of fieldsToSearch) {
        const idx = field.indexOf(token2);
        if (idx !== -1 && idx < bestPos)
          bestPos = idx;
      }
      if (bestPos !== Infinity) {
        cumulativeScore += bestPos;
        return true;
      }
      return false;
    });
    if (matched) {
      cumulativeScore += safeLower(item.displayName).length / 100;
      scoreMap.set(item, cumulativeScore);
    }
    return matched;
  });
  const collapsed = collapseBrandItems(allBrandItems, searchFiltered, scoreMap);
  if (searchTokens.length === 0) {
    collapsed.sort((a, b) => safeLower(a.displayName).localeCompare(safeLower(b.displayName)));
  } else {
    collapsed.sort((a, b) => (a._score ?? Infinity) - (b._score ?? Infinity));
  }
  currentFilteredItems = collapsed;
  currentPage = 1;
  renderCurrentPage();
}
function debounce(func, delay) {
  return function(...args) {
    if (brandSearchSpinner)
      brandSearchSpinner.style.display = "block";
    clearTimeout(brandDebounceTimer);
    brandDebounceTimer = window.setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
var debouncedBrandSearchHandler = debounce(handleBrandSearch, DEBOUNCE_DELAY);
function showBrandModal(item) {
  if (!brandModalBackdrop || !brandModalTitle || !brandModalDetails)
    return;
  if (currentBrandRenderAbortController) {
    return;
  }
  selectedBrandItem = item;
  brandModalTitle.textContent = `Connect to ${item.displayName}?`;
  let detailsHTML = `<p><strong>Display Name:</strong> ${item.displayName}</p>`;
  detailsHTML += `<p><strong>Data Provider:</strong> ${item.brandName}</p>`;
  const hasCollapseInfo = typeof item._matchedCount === "number" && typeof item._totalCount === "number";
  if (!hasCollapseInfo && item.itemType === "facility") {
    const locationParts = [item.city, item.state, item.postalCode].filter(Boolean);
    if (locationParts.length > 0) {
      detailsHTML += `<p><strong>Location:</strong> ${locationParts.join(", ")}</p>`;
    }
  }
  if (hasCollapseInfo) {
    detailsHTML += `<p><strong>Matched:</strong> ${item._matchedCount} of ${item._totalCount} card${item._totalCount !== 1 ? "s" : ""}</p>`;
  }
  if (item.endpoints && Array.isArray(item.endpoints) && item.endpoints.length > 0) {
    detailsHTML += `<p><strong>Endpoints:</strong></p><ul>`;
    item.endpoints.forEach((ep) => {
      const isFhir = ep.type === "FHIR_BASE_URL" || safeLower(ep.url).includes("fhir");
      detailsHTML += `<li style="${isFhir ? "font-weight: bold;" : ""}">${ep.url}${ep.name ? ` (${ep.name})` : ""}${ep.type ? ` [${ep.type}]` : ""}</li>`;
    });
    detailsHTML += `</ul>`;
  } else {
    detailsHTML += `<p><strong>Endpoints:</strong> None found</p>`;
  }
  const vc = item._vendorConfig;
  if (vc && vc.note) {
    detailsHTML += `<p style="margin-top:0.8rem;"><em>Login Info:</em> ${vc.note}</p>`;
  }
  brandModalDetails.innerHTML = detailsHTML;
  brandModalBackdrop.classList.add("visible");
}
function hideBrandModal() {
  if (!brandModalBackdrop)
    return;
  brandModalBackdrop.classList.remove("visible");
  selectedBrandItem = null;
}
async function initiateSmartAuth(fhirBaseUrl, vendorAuthConfig, vendorLabel = "vendor") {
  const defaultRedirectUri = window.location.origin + window.location.pathname;
  console.log(`[initiateSmartAuth] Starting for FHIR Base URL: ${fhirBaseUrl}, VendorLabel: ${vendorLabel}`);
  showStatusContainer(true);
  showProgressContainer(false);
  updateStatus("Preparing authorization request...");
  const { clientId, scopes, redirectUrl } = vendorAuthConfig;
  if (!clientId || !scopes) {
    updateStatus("Error: Missing SMART client configuration (clientId/scopes).", true);
    console.error("VendorAuthConfig missing fields:", vendorAuthConfig);
    return;
  }
  const redirectUri = redirectUrl ? makeAbsoluteUrl(redirectUrl) : defaultRedirectUri;
  console.log("[initiateSmartAuth] Using VendorAuthConfig:", vendorAuthConfig);
  try {
    updateStatus("Performing SMART discovery...");
    const fhirBaseUrlWithSlash = fhirBaseUrl.endsWith("/") ? fhirBaseUrl : fhirBaseUrl + "/";
    const wellKnownUrlString = fhirBaseUrlWithSlash + ".well-known/smart-configuration";
    console.log(`[initiateSmartAuth] Attempting SMART discovery at: ${wellKnownUrlString}`);
    const discoveryResponse = await fetchWithRetry(wellKnownUrlString, {
      headers: { Accept: "application/json" }
    });
    if (!discoveryResponse.ok) {
      throw new Error(`SMART discovery failed: ${discoveryResponse.status} ${discoveryResponse.statusText} ` + `(${wellKnownUrlString}). This organization's endpoint may not be available.`);
    }
    const smartConfig = await discoveryResponse.json();
    const authorizationEndpoint = smartConfig.authorization_endpoint;
    const tokenEndpoint = smartConfig.token_endpoint;
    if (!authorizationEndpoint || !tokenEndpoint) {
      throw new Error("SMART configuration missing required authorization or token endpoint.");
    }
    updateStatus("SMART discovery successful.");
    updateStatus("Generating security parameters...");
    const { code_verifier: codeVerifier, code_challenge: codeChallenge } = $d415641d0cfd8c85$export$2e2bcd8739ae039();
    const state = generateRandomString();
    const authState = {
      codeVerifier,
      state,
      tokenEndpoint,
      clientId,
      redirectUri,
      fhirBaseUrl
    };
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    console.log("[initiateSmartAuth] Stored auth state in sessionStorage");
    const authUrl = new URL(authorizationEndpoint);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("aud", fhirBaseUrl);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    updateStatus("Redirecting to EHR for authorization...");
    console.log(`[initiateSmartAuth] Redirecting to: ${authUrl.toString()}`);
    window.location.href = authUrl.toString();
  } catch (err) {
    updateStatus(`Error during authorization initiation: ${err.message}`, true);
    if (brandSelectorContainer)
      brandSelectorContainer.style.display = "block";
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(DELIVERY_TARGET_KEY);
  }
}
function handleBrandConnect() {
  if (!selectedBrandItem || !brandSelectorContainer) {
    console.error("Connect clicked but required elements or selection missing.");
    hideBrandModal();
    updateStatus("Error: Cannot proceed with connection. Missing information.", true);
    if (brandSelectorContainer)
      brandSelectorContainer.style.display = "block";
    return;
  }
  const vendorConfig = selectedBrandItem._vendorConfig;
  if (!vendorConfig) {
    console.error("Selected brand item is missing _vendorConfig property.");
    updateStatus("Error: Selected organization is missing SMART client credentials.", true);
    return;
  }
  console.log("--- Brand Connect Button Clicked ---");
  console.log("Selected Item:", selectedBrandItem);
  console.log("Using vendorConfig:", vendorConfig);
  let fhirEndpointUrl = null;
  if (selectedBrandItem.endpoints && Array.isArray(selectedBrandItem.endpoints) && selectedBrandItem.endpoints.length > 0) {
    fhirEndpointUrl = selectedBrandItem.endpoints[0].url;
  }
  const brandLabel = selectedBrandItem.brandName || "vendor";
  hideBrandModal();
  if (fhirEndpointUrl) {
    console.log(`Found FHIR Endpoint: ${fhirEndpointUrl}`);
    if (brandSelectorContainer)
      brandSelectorContainer.style.display = "none";
    initiateSmartAuth(fhirEndpointUrl, vendorConfig, brandLabel);
  } else {
    console.error("Could not find a suitable FHIR endpoint for the selected organization.");
    updateStatus("Error: Could not find a FHIR endpoint for the selected organization. Please try another.", true);
    if (brandSelectorContainer)
      brandSelectorContainer.style.display = "block";
  }
}
async function fetchBrandsAndInitialize() {
  console.log("[fetchBrands] Function started.");
  if (!brandInitialLoadingMessage || !brandResultsContainer || !brandSearchInput || !brandSearchSpinner || !brandPaginationControls) {
    console.error("[fetchBrands] Error: Required DOM elements not found!");
    if (brandInitialLoadingMessage) {
      brandInitialLoadingMessage.textContent = "Initialization Error: UI elements missing.";
      brandInitialLoadingMessage.style.color = "red";
    }
    return;
  }
  brandInitialLoadingMessage.textContent = "Loading organizations data...";
  brandResultsContainer.style.display = "none";
  brandPaginationControls.style.display = "none";
  brandSearchInput.disabled = true;
  brandSearchSpinner.style.display = "block";
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get("brandTags");
    let tagFilterGroups = [];
    if (tagParam) {
      const orGroups = tagParam.split(",").map((g) => g.trim()).filter(Boolean);
      tagFilterGroups = orGroups.map((group) => group.split("^").map((t2) => t2.trim().toLowerCase()).filter(Boolean)).filter((group) => group.length > 0);
      console.log(`[fetchBrands] Applying tag filters (OR groups of AND tags):`, tagFilterGroups);
    } else {
      tagFilterGroups = [["prod"]];
      console.log(`[fetchBrands] No tags specified, defaulting to requiring 'prod' tag.`);
    }
    const brandIndex = typeof [{ url: "/brands/epic.json", tags: ["epic", "prod"], vendorConfig: { clientId: "0eb38377-086f-4850-98b3-db0bac91e332", scopes: "patient/*.read", redirectUrl: "https://health.circlejtp.me/ehr-callback" } }, { url: "/brands/epic-sandbox.json", tags: ["epic", "sandbox"], vendorConfig: { clientId: "8d804225-8ca7-430b-99f1-2b7762258e09", scopes: "patient/*.read", redirectUrl: "https://health.circlejtp.me/ehr-callback", note: "Epic sandbox test patient - username 'fhircamila', password 'epicepic1'" } }] !== "undefined" && Array.isArray([{ url: "/brands/epic.json", tags: ["epic", "prod"], vendorConfig: { clientId: "0eb38377-086f-4850-98b3-db0bac91e332", scopes: "patient/*.read", redirectUrl: "https://health.circlejtp.me/ehr-callback" } }, { url: "/brands/epic-sandbox.json", tags: ["epic", "sandbox"], vendorConfig: { clientId: "8d804225-8ca7-430b-99f1-2b7762258e09", scopes: "patient/*.read", redirectUrl: "https://health.circlejtp.me/ehr-callback", note: "Epic sandbox test patient - username 'fhircamila', password 'epicepic1'" } }]) ? [{ url: "/brands/epic.json", tags: ["epic", "prod"], vendorConfig: { clientId: "0eb38377-086f-4850-98b3-db0bac91e332", scopes: "patient/*.read", redirectUrl: "https://health.circlejtp.me/ehr-callback" } }, { url: "/brands/epic-sandbox.json", tags: ["epic", "sandbox"], vendorConfig: { clientId: "8d804225-8ca7-430b-99f1-2b7762258e09", scopes: "patient/*.read", redirectUrl: "https://health.circlejtp.me/ehr-callback", note: "Epic sandbox test patient - username 'fhircamila', password 'epicepic1'" } }] : [];
    if (brandIndex.length === 0) {
      throw new Error("No brand index entries provided");
    }
    const filesToLoad = brandIndex.filter((entry) => {
      if (tagFilterGroups.length === 0) {
        return false;
      }
      const entryTagsLower = entry.tags.map((t2) => t2.toLowerCase());
      return tagFilterGroups.some((andGroup) => andGroup.every((requiredTag) => entryTagsLower.includes(requiredTag)));
    });
    if (filesToLoad.length === 0) {
      throw new Error(`No brand files matched desired tags: ${tagFilterGroups.map((group) => group.join(", ")).join(", ")}`);
    }
    console.log(`[fetchBrands] Loading ${filesToLoad.length} brand files...`);
    const filePromises = filesToLoad.map(async (entry) => {
      try {
        const response = await fetch(entry.url);
        if (!response.ok)
          throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (!json || !Array.isArray(json.items))
          throw new Error("Invalid structure: items array missing");
        json.items.forEach((itm) => itm._vendorConfig = entry.vendorConfig);
        return json.items;
      } catch (e2) {
        console.error(`[fetchBrands] Failed to load brand file '${entry.url}':`, e2);
        return [];
      }
    });
    const brandItemsArrays = await Promise.all(filePromises);
    console.log(`[fetchBrands] Loaded ${brandItemsArrays.length} brand files.`, brandItemsArrays);
    const aggregatedItems = [].concat(...brandItemsArrays);
    if (aggregatedItems.length === 0) {
      throw new Error("No organization records loaded from brand files.");
    }
    console.log(`[fetchBrands] Loaded ${aggregatedItems.length} organization records from brand files.`);
    allBrandItems = aggregatedItems;
    currentFilteredItems = collapseBrandItems(allBrandItems, aggregatedItems, new Map);
    currentFilteredItems.sort((a, b) => safeLower(a.displayName).localeCompare(safeLower(b.displayName)));
    brandInitialLoadingMessage.style.display = "none";
    brandResultsContainer.style.display = "grid";
    brandSearchInput.disabled = false;
    currentPage = 1;
    renderCurrentPage();
    brandSearchInput.focus();
    brandSearchInput.addEventListener("input", debouncedBrandSearchHandler);
    if (brandModalCancel)
      brandModalCancel.addEventListener("click", hideBrandModal);
    if (brandModalConnect)
      brandModalConnect.addEventListener("click", handleBrandConnect);
    if (brandModalBackdrop)
      brandModalBackdrop.addEventListener("click", (event) => {
        if (event.target === brandModalBackdrop)
          hideBrandModal();
      });
    if (brandPrevBtn)
      brandPrevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderCurrentPage();
        }
      });
    if (brandNextBtn)
      brandNextBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(currentFilteredItems.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
          currentPage++;
          renderCurrentPage();
        }
      });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && brandModalBackdrop?.classList.contains("visible")) {
        hideBrandModal();
      }
    });
  } catch (error) {
    console.error("[fetchBrands] Error:", error);
    if (brandInitialLoadingMessage) {
      brandInitialLoadingMessage.textContent = `Error loading organizations: ${error.message}`;
      brandInitialLoadingMessage.style.color = "red";
    }
    brandResultsContainer.style.display = "none";
    brandSearchInput.disabled = true;
  } finally {
    brandSearchSpinner.style.display = "none";
  }
}
document.addEventListener("DOMContentLoaded", () => {
  brandSelectorContainer = document.getElementById("brand-selector-container");
  brandSearchInput = document.getElementById("brand-search-input");
  brandSearchSpinner = document.getElementById("brand-search-spinner");
  brandResultsContainer = document.getElementById("brand-results-container");
  brandModalBackdrop = document.getElementById("brand-modal-backdrop");
  brandModal = document.getElementById("brand-modal");
  brandModalTitle = document.getElementById("brand-modal-title");
  brandModalDetails = document.getElementById("brand-modal-details");
  brandModalCancel = document.getElementById("brand-modal-cancel");
  brandModalConnect = document.getElementById("brand-modal-connect");
  brandInitialLoadingMessage = document.getElementById("brand-initial-loading-message");
  brandPaginationControls = document.getElementById("brand-pagination-controls");
  brandPrevBtn = document.getElementById("brand-prev-btn");
  brandNextBtn = document.getElementById("brand-next-btn");
  brandPageInfo = document.getElementById("brand-page-info");
  statusContainer = document.getElementById("status-container");
  statusMessageElement = document.getElementById("status-message");
  progressContainer = document.getElementById("progress-container");
  progressBar = document.getElementById("fetch-progress");
  progressText = document.getElementById("progress-text");
  downloadDataBtn = document.getElementById("download-data-btn");
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");
  const error = urlParams.get("error");
  const errorDescription = urlParams.get("error_description");
  const defaultRedirectUri = window.location.origin + window.location.pathname;
  if (error) {
    showStatusContainer(true);
    updateStatus(`Authorization Error: ${error} - ${errorDescription || "No description provided."}`, true);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  if (code && state) {
    (async () => {
      showStatusContainer(true);
      updateStatus("Received authorization code. Validating...");
      console.log("Detected redirect from EHR.");
      console.log(`Code: ${code.substring(0, 10)}...`, `State: ${state}`);
      if (brandSelectorContainer)
        brandSelectorContainer.style.display = "none";
      showProgressContainer(false);
      showConfirmationContainer(false);
      const storedStateString = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!storedStateString) {
        updateStatus("Error: Auth state missing from storage. Please start over.", true);
        return;
      }
      let storedState;
      try {
        storedState = JSON.parse(storedStateString);
      } catch (e2) {
        updateStatus("Error: Could not parse stored auth state.", true);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }
      if (state !== storedState.state) {
        updateStatus("Error: State parameter mismatch. Potential CSRF attack.", true);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }
      updateStatus("State validated. Exchanging code for token...");
      const { tokenEndpoint, codeVerifier, clientId, redirectUri, fhirBaseUrl } = storedState;
      console.log(`Using redirect_uri for token exchange: ${redirectUri}`);
      try {
        const tokenParams = new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          code_verifier: codeVerifier
        });
        const tokenResponse = await fetch(tokenEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json"
          },
          body: tokenParams.toString()
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
          const errorDetails = tokenData.error_description || tokenData.error || JSON.stringify(tokenData);
          throw new Error(`Token exchange failed (${tokenResponse.status}): ${errorDetails}`);
        }
        const accessToken = tokenData.access_token;
        const patientId = tokenData.patient;
        const grantedScopes = tokenData.scope;
        if (!accessToken || !patientId) {
          throw new Error("Token response missing required access_token or patient ID.");
        }
        updateStatus("Token received successfully.");
        console.log(`Access Token: ${accessToken.substring(0, 8)}...`);
        console.log(`Patient ID: ${patientId}`);
        console.log(`Granted Scopes: ${grantedScopes || "N/A"}`);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        console.log("Cleared auth state from sessionStorage.");
        updateStatus("Fetching EHR data (this may take a while)...");
        showProgressContainer(true);
        updateProgress(0, 0, "Initiating fetch...");
        let fetchedClientFullEhrObject = null;
        try {
          fetchedClientFullEhrObject = await fetchAllEhrDataClientSideParallel(accessToken, fhirBaseUrl, patientId, updateProgress);
        } catch (fetchError) {
          updateStatus(`Error fetching EHR data: ${fetchError.message}`, true);
          console.error("Error during fetchAllEhrDataClientSideParallel:", fetchError);
          showProgressContainer(false);
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
          sessionStorage.removeItem(DELIVERY_TARGET_KEY);
          sessionStorage.removeItem(OPENER_TARGET_ORIGIN_KEY);
          return;
        }
        console.log("Returned from fetchAllEhrDataClientSideParallel. EHR data:", fetchedClientFullEhrObject);
        showProgressContainer(false);
        console.log("--- ClientFullEHR Object ---");
        console.log(fetchedClientFullEhrObject);
        console.log("----------------------------");
        let totalResources = 0;
        let resourceTypeCount = 0;
        if (fetchedClientFullEhrObject?.fhir) {
          resourceTypeCount = Object.keys(fetchedClientFullEhrObject.fhir).length;
          for (const resourceType in fetchedClientFullEhrObject.fhir) {
            if (Object.prototype.hasOwnProperty.call(fetchedClientFullEhrObject.fhir, resourceType) && Array.isArray(fetchedClientFullEhrObject.fhir[resourceType])) {
              totalResources += fetchedClientFullEhrObject.fhir[resourceType].length;
            }
          }
        }
        const attachmentCount = fetchedClientFullEhrObject?.attachments?.length || 0;
        let finalStatus = `Data fetched successfully! ${resourceTypeCount} resource types, ${totalResources} total resources, and ${attachmentCount} attachments retrieved.`;
        updateStatus(finalStatus);
        console.log("Proceeding to delivery check...");
        console.log("[Delivery Check] Checking sessionStorage for key:", DELIVERY_TARGET_KEY);
        const deliveryTargetName = sessionStorage.getItem(DELIVERY_TARGET_KEY);
        const openerTargetOrigin = sessionStorage.getItem(OPENER_TARGET_ORIGIN_KEY);
        console.log("[Delivery Check] Value found in sessionStorage (Target Name):", deliveryTargetName);
        console.log("[Delivery Check] Value found in sessionStorage (Opener Origin):", openerTargetOrigin);
        showConfirmationContainer(false);
        if (downloadDataBtn)
          downloadDataBtn.style.display = "none";
        if (deliveryTargetName) {
          console.log(`[Delivery Check] Delivery target found: ${deliveryTargetName}. Comparing with OPENER_TARGET_VALUE:`, OPENER_TARGET_VALUE);
          if (deliveryTargetName === OPENER_TARGET_VALUE) {
            console.log("[Delivery Check] Target is opener. Preparing inline confirmation...");
            if (openerTargetOrigin) {
              updateStatus("Data fetched. Waiting for confirmation to send...");
              console.log(`Preparing confirmation UI to send data to: ${openerTargetOrigin}`);
              if (confirmationMessageElement) {
                confirmationMessageElement.textContent = `You have successfully fetched your EHR data. Do you want to send this data back to the application at origin "${openerTargetOrigin}"?`;
              }
              showStatusContainer(false);
              showProgressContainer(false);
              showConfirmationContainer(true);
              if (confirmSendBtn && cancelSendBtn) {
                confirmSendBtn.onclick = () => {
                  console.log("User confirmed data delivery via inline button.");
                  if (confirmSendBtn)
                    confirmSendBtn.disabled = true;
                  if (cancelSendBtn)
                    cancelSendBtn.disabled = true;
                  showConfirmationContainer(false);
                  showStatusContainer(true);
                  updateStatus("Confirmed. Sending data...");
                  try {
                    updateStatus(`${finalStatus} Delivering data via postMessage to ${openerTargetOrigin}...`);
                    window.opener.postMessage(fetchedClientFullEhrObject, openerTargetOrigin);
                    finalStatus += ` Data successfully SENT via postMessage call to ${openerTargetOrigin}.`;
                    updateStatus(finalStatus);
                    console.log(`Successfully CALLED postMessage targeting ${openerTargetOrigin}.`);
                    sessionStorage.removeItem(DELIVERY_TARGET_KEY);
                    sessionStorage.removeItem(OPENER_TARGET_ORIGIN_KEY);
                  } catch (postMessageError) {
                    finalStatus += ` Delivery via postMessage CALL FAILED: ${postMessageError.message}`;
                    updateStatus(finalStatus, true);
                    console.error(`Failed to CALL postMessage to ${openerTargetOrigin}:`, postMessageError);
                  } finally {
                    console.log("Attempting to close retriever window after confirmed postMessage attempt.");
                    setTimeout(() => window.close(), 500);
                  }
                };
                cancelSendBtn.onclick = () => {
                  console.log("User cancelled data delivery via inline button.");
                  if (confirmSendBtn)
                    confirmSendBtn.disabled = true;
                  if (cancelSendBtn)
                    cancelSendBtn.disabled = true;
                  showConfirmationContainer(false);
                  showStatusContainer(true);
                  finalStatus = "Delivery cancelled by user. You may now close this window.";
                  updateStatus(finalStatus);
                  if (downloadDataBtn) {
                    downloadDataBtn.style.display = "inline-block";
                    downloadDataBtn.onclick = () => {
                      triggerJsonDownload(fetchedClientFullEhrObject, "ehr-data-cancelled-delivery.json");
                      if (downloadDataBtn)
                        downloadDataBtn.disabled = true;
                    };
                  }
                  sessionStorage.removeItem(DELIVERY_TARGET_KEY);
                  sessionStorage.removeItem(OPENER_TARGET_ORIGIN_KEY);
                  console.log("Closing retriever window after cancellation.");
                };
              } else {
                console.error("Confirmation buttons not found!");
                updateStatus("Error: Confirmation UI elements missing. Cannot proceed.", true);
                showConfirmationContainer(false);
                showStatusContainer(true);
                console.log("Attempting to close retriever window due to missing UI elements.");
                setTimeout(() => window.close(), 500);
              }
            } else {
              finalStatus += ` Delivery via postMessage FAILED: Opener's target origin not found in session storage. Cannot target postMessage. You may download your data below.`;
              updateStatus(finalStatus, true);
              if (downloadDataBtn) {
                downloadDataBtn.style.display = "inline-block";
                downloadDataBtn.onclick = () => {
                  triggerJsonDownload(fetchedClientFullEhrObject, "ehr-data-missing-origin.json");
                  if (downloadDataBtn)
                    downloadDataBtn.disabled = true;
                };
              }
              console.error("Cannot postMessage to opener: Target origin missing from session storage.");
            }
          } else {
            let deliveryEndpoints = {};
            deliveryEndpoints = __DELIVERY_ENDPOINTS__ || {};
            const endpointConfig = deliveryEndpoints[deliveryTargetName];
            if (endpointConfig && endpointConfig.postUrl) {
              const postUrl = makeAbsoluteUrl(endpointConfig.postUrl);
              updateStatus(`${finalStatus} Delivering data to ${deliveryTargetName} at ${postUrl}...`);
              try {
                const deliveryResponse = await fetch(postUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(fetchedClientFullEhrObject)
                });
                if (!deliveryResponse.ok) {
                  const errorBody = await deliveryResponse.text();
                  throw new Error(`Delivery POST failed (${deliveryResponse.status}): ${errorBody}`);
                }
                console.log(`Successfully POSTed data to ${deliveryTargetName} (${postUrl})`);
                sessionStorage.removeItem(DELIVERY_TARGET_KEY);
                try {
                  const jsonData = await deliveryResponse.json();
                  console.log("JSON response from delivery endpoint:", jsonData);
                  if (jsonData.success === true && typeof jsonData.redirectTo === "string" && jsonData.redirectTo) {
                    updateStatus(`${finalStatus} Data POST successful. Redirecting to complete flow...`);
                    console.log(`Redirecting to: ${jsonData.redirectTo}`);
                    window.location.href = jsonData.redirectTo;
                    return;
                  } else if (jsonData.success === true && !jsonData.redirectTo) {
                    finalStatus = `Data fetched and POST successful. No redirect specified. You may download your data or close this window.`;
                    updateStatus(finalStatus);
                    if (downloadDataBtn) {
                      downloadDataBtn.style.display = "inline-block";
                      downloadDataBtn.onclick = () => {
                        triggerJsonDownload(fetchedClientFullEhrObject, `ehr-data-${deliveryTargetName}.json`);
                        if (downloadDataBtn)
                          downloadDataBtn.disabled = true;
                      };
                    }
                    console.log("Delivery successful, no redirect specified, download offered.");
                  } else {
                    const serverError = jsonData.error || "unknown_server_error";
                    const serverErrorDesc = jsonData.error_description || "Server did not provide redirect URL or indicated failure.";
                    throw new Error(`Server Error (${serverError}): ${serverErrorDesc}`);
                  }
                } catch (parseError) {
                  console.error("Failed to parse JSON response from delivery endpoint:", parseError);
                  throw new Error("Received malformed response from the delivery server.");
                }
              } catch (deliveryError) {
                console.error(`Failed to POST or process response for ${deliveryTargetName}:`, deliveryError);
                finalStatus += ` Delivery to ${deliveryTargetName} FAILED: ${deliveryError.message || "Unknown delivery error"}. You may download your data below.`;
                updateStatus(finalStatus, true);
                if (downloadDataBtn) {
                  downloadDataBtn.style.display = "inline-block";
                  downloadDataBtn.onclick = () => {
                    triggerJsonDownload(fetchedClientFullEhrObject, "ehr-data-delivery-failed.json");
                    if (downloadDataBtn)
                      downloadDataBtn.disabled = true;
                  };
                }
              }
            } else {
              finalStatus += ` Delivery target '${deliveryTargetName}' configuration invalid or incomplete (missing postUrl). You may download your data below.`;
              updateStatus(finalStatus, true);
              if (downloadDataBtn) {
                downloadDataBtn.style.display = "inline-block";
                downloadDataBtn.onclick = () => {
                  triggerJsonDownload(fetchedClientFullEhrObject, "ehr-data-invalid-config.json");
                  if (downloadDataBtn)
                    downloadDataBtn.disabled = true;
                };
              }
              console.error(`Delivery target '${deliveryTargetName}' requested but configuration is invalid in __DELIVERY_ENDPOINTS__.`);
              sessionStorage.removeItem(DELIVERY_TARGET_KEY);
            }
          }
        } else {
          console.log("No delivery target specified in session storage.");
          finalStatus += `. No delivery target specified. You may download your data or close this window.`;
          updateStatus(finalStatus);
          if (downloadDataBtn) {
            downloadDataBtn.style.display = "inline-block";
            downloadDataBtn.onclick = () => {
              triggerJsonDownload(fetchedClientFullEhrObject, "ehr-data.json");
              if (downloadDataBtn)
                downloadDataBtn.disabled = true;
            };
          }
        }
      } catch (err) {
        updateStatus(`Error during authorization or data processing: ${err.message}`, true);
        console.error("Unhandled error in redirect handler:", err);
        showProgressContainer(false);
        showConfirmationContainer(false);
        showStatusContainer(true);
        if (downloadDataBtn)
          downloadDataBtn.style.display = "none";
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        sessionStorage.removeItem(DELIVERY_TARGET_KEY);
        sessionStorage.removeItem(OPENER_TARGET_ORIGIN_KEY);
      }
    })();
  } else {
    console.log("Initial page load. Setting up brand selector.");
    if (brandSelectorContainer)
      brandSelectorContainer.style.display = "block";
    if (brandPaginationControls)
      brandPaginationControls.style.display = "none";
    if (statusContainer)
      statusContainer.style.display = "none";
    showProgressContainer(false);
    fetchBrandsAndInitialize().then(() => {
      const hash = window.location.hash;
      sessionStorage.removeItem(DELIVERY_TARGET_KEY);
      sessionStorage.removeItem(OPENER_TARGET_ORIGIN_KEY);
      if (hash) {
        const openerPrefix = "#deliver-to-opener:";
        if (hash.startsWith(openerPrefix)) {
          const targetOrigin = hash.substring(openerPrefix.length);
          if (targetOrigin) {
            try {
              new URL(targetOrigin);
              sessionStorage.setItem(DELIVERY_TARGET_KEY, OPENER_TARGET_VALUE);
              sessionStorage.setItem(OPENER_TARGET_ORIGIN_KEY, targetOrigin);
              console.log(`Found and stored delivery target: Opener Window`);
              console.log(`Stored opener target origin: ${targetOrigin}`);
              history.replaceState(null, "", " ");
            } catch (e2) {
              console.warn(`Invalid target origin provided in hash: ${targetOrigin}`);
            }
          } else {
            console.warn("Found #deliver-to-opener: but target origin is empty.");
          }
        } else if (hash.startsWith("#deliver-to:")) {
          const targetName = hash.substring("#deliver-to:".length);
          if (targetName) {
            sessionStorage.setItem(DELIVERY_TARGET_KEY, targetName);
            console.log(`Found and stored delivery target: ${targetName}`);
            history.replaceState(null, "", " ");
          } else {
            console.warn("Found #deliver-to: but target name is empty.");
          }
        }
      }
    });
    showConfirmationContainer(false);
    if (downloadDataBtn)
      downloadDataBtn.style.display = "none";
  }
});
function triggerJsonDownload(data, filename) {
  if (!data) {
    console.error("Download triggered but data is null.");
    alert("Error: No data available to download.");
    return;
  }
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`Successfully triggered download of ${filename}`);
  } catch (error) {
    console.error(`Error creating or triggering download for ${filename}:`, error);
    alert(`Failed to initiate download: ${error.message}`);
  }
}
