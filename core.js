'use strict';

var RtmClient = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

var config = require('./config');

var bot = {
};

var instant = [];
var procs = [];

var start_data = {};
var channelname_data_map = {};
var username_data_map = {};

var token = config.get('SLACK_TOKEN');

//var rtm = new RtmClient(token, {logLevel: 'debug'});
var rtm = new RtmClient(token);
rtm.start();

var heart_beat = null;

var _constant = function(_) {
  return function(){return _;};
};

var _ask = function(f) {
  var args = (arguments.length === 1?
              [arguments[0]]:
              Array.apply(null, arguments));
  if (typeof f === 'function') {
    instant.push(function(){return f.apply(this, args.slice(1));});
  }
};

bot.say = function(message, channel, cb) {
  var _cb = cb || function(){};
  _ask(
    function(){
      if (channelname_data_map[channel] === void 0)
      {

        return _cb(new Error('unknown channel: ' + channel), null);
      }
      rtm.sendMessage(message,
                      channelname_data_map[channel].id,
                      _cb);
    }
  );
};

var _kill = function()
{
  if (heart_beat == null) {
    return;
  }
  if (arguments.length === 0 || arguments[0] > 0) {
    if (instant.length) {
      setTimeout(_kill, 3000, (arguments[0]-1)||5);
      return;
    }
  }
  rtm.disconnect();
  clearInterval(heart_beat);
  heart_beat = null;
};

bot.kill = _kill;

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
  start_data = rtmStartData;
  start_data.channels.forEach(function(d)
  {
    channelname_data_map[d.name] = d;
  });
  start_data.users.forEach(function(d) {
    username_data_map[d.name] = d;
  });
});

rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
  heart_beat = setInterval(function()
  {
    if (instant.length) {
      setTimeout(instant.shift(1)(), 200);
    }
  }, 2000);
});

process.on('exit', function() {
  _kill();
});

module.exports = bot;
