'use strict';

var _ = require('lodash');

var babelHelpers = {};

babelHelpers.typeof = function (obj) {
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
};

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

babelHelpers.createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

babelHelpers;
var special = { regex: _.isRegExp, array: _.isArray };
function istype(val, types) {
	if (_.isArray(types)) {
		return types.some(function (type) {
			return _.has(special, type) ? special[type](val) : (typeof val === "undefined" ? "undefined" : babelHelpers.typeof(val)) === type;
		});
	} else if (typeof types === "string") {
		return istype(val, [types]);
	} else {
		var type = typeof val === "undefined" ? "undefined" : babelHelpers.typeof(val);
		_.some(special, function (fnc, t) {
			if (fnc(val)) return type = t;
		});
		return type;
	}
}

function ismatch(val) {
	return istype(val, ["string", "regex", "function"]);
}

function isreplace(val) {
	return istype(val, ["string", "function", "undefined"]);
}

var presets = {
	tag: /\#[\S]+/ig,
	email: /[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/ig,
	url: /(?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?/gi
};

function register(name, match) {
	if (typeof name !== "string" || !name) {
		throw new TypeError("Expecting non-empty string for preset name.");
	}

	if (!ismatch(match)) {
		throw new TypeError("Expecting a string, regexp or function for preset match.");
	}

	presets[name] = match;
}

var Parser = (function () {
	function Parser() {
		babelHelpers.classCallCheck(this, Parser);

		this.rules = [];
	}

	babelHelpers.createClass(Parser, [{
		key: "addRule",
		value: function addRule(match, replace) {
			if (!ismatch(match)) throw new TypeError("Expecting string, regex, or function for match.");
			if (!isreplace(replace)) throw new TypeError("Expecting string or function for replace.");
			this.rules.push({ match: match, replace: replace });
			return this;
		}
	}, {
		key: "addPreset",
		value: function addPreset(name, _replace) {
			if (!_.has(presets, name)) throw new Error("Preset " + name + " doesn't exist.");

			this.rules.push({
				match: presets[name],
				replace: function replace(str) {
					var ret = { type: name, value: str, text: str };

					if (typeof _replace === "function") {
						var val = _replace(str);
						if ((typeof val === "undefined" ? "undefined" : babelHelpers.typeof(val)) === "object") _.assign(ret, val);else if (typeof val === "string") ret.text = val;
					}

					return ret;
				}
			});

			return this;
		}
	}, {
		key: "toTree",
		value: function toTree(str) {
			var _this = this;

			var tree = [];
			var match = this.rules.some(function (rule) {
				var m = rule.match;

				var replace = function replace(str, groups) {
					var r = rule.replace;
					var v = undefined,
					    args = undefined;

					switch (istype(r)) {
						case "function":
							args = [str];
							if (groups) args = args.concat(groups);
							v = r.apply(_this, args);
							break;
						case "string":
							v = r;
							break;
						default:
							v = str;
							break;
					}

					if (typeof v === "string") {
						v = { type: "text", text: v };
						if (groups) v.groups = groups.slice(0);
					}

					return v;
				};

				var si = undefined,
				    i = undefined,
				    rmatch = undefined;

				switch (istype(m)) {
					case "string":
						if (str.indexOf(m) < 0) return;

						si = 0;
						while ((i = str.indexOf(m, si)) > -1) {
							tree.push(str.substring(si, i));
							tree.push(replace(str.substr(i, m.length)));
							si = i + m.length;
						}

						tree.push(str.substr(si));
						break;

					case "regex":
						rmatch = m.exec(str);
						if (!rmatch) return;
						i = 0;

						while (rmatch != null) {
							tree.push(str.substring(i, rmatch.index));
							var substr = str.substr(rmatch.index, rmatch[0].length);
							tree.push(replace(substr, _.toArray(rmatch).slice(1)));
							i = rmatch.index + rmatch[0].length;

							rmatch = (rmatch.flags || "").indexOf("g") >= 0 ? m.exec(str) : null;
						}

						tree.push(str.substr(i));
						break;

					case "function":
						rmatch = m(str);
						si = 0;
						if (!Array.isArray(rmatch)) return;
						if (rmatch.filter(_.isNumber).length === 2) rmatch = [rmatch];
						if (!rmatch.length) return;

						rmatch.forEach(function (part) {
							part = _.filter(part, _.isNumber);
							if (_.size(part) !== 2) return;
							if (part[0] < si) return;

							tree.push(str.substring(si, part[0]));
							tree.push(replace(str.substr(part[0], part[1])));
							si = part[0] + part[1];
						});

						tree.push(str.substr(si));
						break;
				}

				return true;
			});

			if (!match) return [{ type: "text", text: str }];

			return tree.reduce(function (t, item) {
				if (item) {
					t = t.concat(typeof item === "string" ? _this.toTree(item) : item);
				}

				return t;
			}, []);
		}
	}, {
		key: "render",
		value: function render(str) {
			return this.toTree(str).map(function (part) {
				if (typeof part === "string") return part;else if ((typeof part === "undefined" ? "undefined" : babelHelpers.typeof(part)) === "object" && part) return part.text;else return "";
			}).join("");
		}
	}, {
		key: "parse",
		value: function parse(str) {
			console.warn("Parser#parse() has been deprecated and will be removed in a future release. Please use Parser#render() instead.");

			return this.render(str);
		}
	}]);
	return Parser;
})();

Parser.presets = presets;
Parser.registerPreset = register;

module.exports = Parser;