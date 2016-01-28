'use strict'

var ConfigurationHelper = require('./rules')
var StateHelper = require('./state')
var _ = require('lodash')
var Async = require('async')

module.exports = function (options) {
  var seneca = this

  var internals = {}

  function close (args, done) {
    var sm_name = args.name

    if (!sm_name) {
      return done('Invalid state machine name')
    }

    if (!internals[sm_name]) {
      return done('State machine not found')
    }

    delete internals[sm_name]
    done()
  }

  function create (args, done) {
    var config = args
    var sm_name = config.name

    if (internals[sm_name]) {
      return done('SM already exists')
    }

    var validate_error = ConfigurationHelper.validate(config)
    if (validate_error) {
      return done(validate_error)
    }

    var context = {
      config: config,
      commands: {}
    }

    internals[sm_name] = context

    context.current_status = ConfigurationHelper.getInitState(config)

    ConfigurationHelper.processDefaults(config)

    var cmds = ConfigurationHelper.getCommands(config)
    for (var command_name in cmds) {
      if (context.commands[command_name]) {
        // this command was already registered
        continue
      }

      context.commands[command_name] = cmds[command_name]

      seneca
        .add({role: sm_name, cmd: command_name}, execute_state)
    }

    seneca
      .add({role: sm_name, get: 'context'}, get_context)
      .add({role: sm_name, load: 'state'}, load_state)

    done()
  }

  function get_context (args, done) {
    var context = internals[args.role]

    if (!context) {
      return done('Invalid state-machine id')
    }
    done(null, _.clone(context))
  }

  function load_state (args, done) {
    if (!args.sm_name && !args.state) {
      return done('invalid load state arguments')
    }

    var context = internals[args.sm_name]

    if (!context) {
      return done('state-machine ' + args.sm_name + ' does not exist')
    }

    StateHelper.change(context, args.state)
    var afterCommand = ConfigurationHelper.retrieve_after_command(context.config, context.current_status)
    if (afterCommand) {
      seneca.act(afterCommand.pattern, function(err, result) {
      })
    }

    return done(null, _.clone(context))
  }

  function execute_state (args, done) {
    var seneca = this
    var context = internals[args.role]
    var command = ConfigurationHelper.retrieve_command(context.config, context.current_status, args.cmd)

    delete args.role
    delete args.cmd

    Async.series({
      command: function (callback) {
        seneca.act(command.pattern, args, function (err, data) {
          StateHelper.findNextState(command, err, data, function (state_err, nextState) {
            if (!nextState) {
              return callback(new Error('undefined next state error'))
            }
            StateHelper.change(context, nextState)
            return callback(err, data)
          })
        })
      },
      after_command: function (callback) {
        var afterCommand = ConfigurationHelper.retrieve_after_command(context.config, context.current_status)
        if (!afterCommand) {
          return callback()
        }
        seneca.act(afterCommand.pattern, function(err, data) {
          callback(err, data)
        })
      }
    }, function (err, results) {
      // the "command" results are returned, the "after_command" ones not returned
      done(err, results.command)
    })
  }

  seneca
    .add({role: 'sm', create: 'instance'}, create)
    .add({role: 'sm', close: 'instance'}, close)
}
