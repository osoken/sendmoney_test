'use strict';

var constant = function(_)
{
  return function(){return _;};
};

var _config = {};

var config = {
  get: function(key) {
    var args = (arguments.length === 1?
                [arguments[0]]:
                Array.apply(null, arguments));
    if (_config[key] !== void 0) {
      return _config[key].apply(this, args.slice(1));
    } else {
      if (process.env[key] !== void 0) {
        return process.env[key];
      }
    }
    return void 0;
  },
  set: function(key, _) {
    if (typeof _ === 'function') {
      _config[key] = _;
    }
    else {
      if (_ == null) {
        delete _config[key];
      }
      else {
        _config[key] = constant(_);
      }
    }
    return this;
  }
};

try {
  var f = require('./.config.json');
  Object.keys(f).forEach(function(d)
  {
    config.set(d, f[d]);
  });
  if (config.get('SLACK_TOKEN') === void 0) {
    config.set('token', process.env.SLACK_TOKEN || function() {
      process.exit(1); // exit
    });
  }
  config.file = '.config.json';
} catch (e) {
  delete config.file;
}
module.exports = config;
