'use strict'

var _ = require('lodash')

function Configuration (config) {
  this.config = config
}

Configuration.prototype.validate = function () {
  var initStateOK = false

  for (var i in this.config.states) {
    if (this.config.states[i].initState) {
      if (initStateOK) {
        return 'One single state should have initState: true'
      }
      initStateOK = true
    }
  }
  if (!initStateOK) {
    return 'One single state should have initState: true'
  }
  return
}

Configuration.prototype.getInitState = function () {
  for (var state_name in this.config.states) {
    if (this.config.states[state_name].initState) {
      return state_name
    }
  }
}

Configuration.prototype.getCommands = function () {
  var cmds = {}
  for (var state_name in this.config.states) {
    for (var command_name in this.config.states[state_name].commands) {
      cmds[command_name] = {
        // maybe I will need something here
      }
    }
  }
  return cmds
}

Configuration.prototype.processDefaults = function () {
  for (var state_name in this.config.states) {
    if (this.config.states[state_name].defaults) {
      for (var command_name in this.config.states[state_name].commands) {
        this.config.states[state_name].commands[command_name].pattern =
          this.config.states[state_name].commands[command_name].pattern ||
          this.config.states[state_name].defaults.pattern
        this.config.states[state_name].commands[command_name].next = _.extend(
          {},
          this.config.states[state_name].defaults.next || {},
          this.config.states[state_name].commands[command_name].next || {}
        )
      }
    }
  }
}

Configuration.prototype.retrieve_command = function (state, cmd) {
  if (this.config.states[state].commands[cmd]) {
    return this.config.states[state].commands[cmd]
  }
  return
}

module.exports = Configuration
