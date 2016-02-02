'use strict'

var _ = require('lodash')

module.exports = {
  validate: function (config) {
    var initStateOK = false

    for (var i in config.states) {
      if (config.states[i].initState) {
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
  },

  getInitState: function (config) {
    for (var state_name in config.states) {
      if (config.states[state_name].initState) {
        return state_name
      }
    }
  },

  getCommands: function (config) {
    var cmds = {}
    for (var state_name in config.states) {
      for (var command_name in config.states[state_name].commands) {
        cmds[command_name] = {
          // maybe I will need something here
        }
      }
    }
    return cmds
  },

  processDefaults: function (config) {
    for (var state_name in config.states) {
      if (config.states[state_name].defaults) {
        for (var command_name in config.states[state_name].commands) {
          config.states[state_name].commands[command_name].pattern =
            config.states[state_name].commands[command_name].pattern ||
            config.states[state_name].defaults.pattern
          config.states[state_name].commands[command_name].next = _.extend(
            {},
            config.states[state_name].defaults.next || {},
            config.states[state_name].commands[command_name].next || {}
          )
        }
      }
    }
  },

  retrieve_command: function (config, state, cmd) {
    if (config.states[state].commands[cmd]) {
      return config.states[state].commands[cmd]
    }
    return
  },

  retrieve_events: function (config, state) {
    // local event handlers
    var events = config.states[state].events
    if (events) {
      return events
    }

    // global event handlers
    events = config.states.events
    if (events) {
      return events
    }

    return null
  },

  retrieve_before_command: function (config, state) {
    var events = this.retrieve_events(config, state)
    if (events && events.before) {
      return events.before
    }

    return null
  },

  retrieve_after_command: function (config, state) {
    var events = this.retrieve_events(config, state)
    if (events && events.after) {
      return events.after
    }

    return null
  }
}
