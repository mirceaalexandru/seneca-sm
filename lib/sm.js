'use strict'

var ConfigurationHelper = require('./rules')
var StateHelper = require('./state')
var _ = require('lodash')
var Async = require('async')

module.exports = function () {
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

      // add this comment if not already defined
      if (!seneca.has('role: sm, cmd: ' + command_name)) {
        seneca
          .add('role: sm, cmd: ' + command_name, execute_state)
      }
    }
    done()
  }

  function get_context (args, done) {
    var context = internals[args.sm_name]

    if (!context) {
      return done('Invalid state-machine name')
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

    this.act('role: sm, change: state', { context: context, nextState: args.state }, function () {
      return done(null, _.clone(context))
    })
  }

  function execute_state (args, done) {
    var seneca = this
    var context = internals[args.sm_name]
    var command = ConfigurationHelper.retrieve_command(context.config, context.current_status, args.cmd)
    var beforeCommand = ConfigurationHelper.retrieve_before_command(context.config, context.current_status)
    var afterCommand = ConfigurationHelper.retrieve_after_command(context.config, context.current_status)

    delete args.role
    delete args.cmd

    Async.series({
      before_command: function (callback) {
        if (!beforeCommand) {
          return callback()
        }
        seneca.act(beforeCommand.pattern, function (err, data) {
          callback(err, data)
        })
      },
      command: function (callback) {
        seneca.act(command.pattern, args, function (err, commandResponse) {
          seneca.act('role: sm, find: nextState', {command: command, err: err, data: commandResponse}, function (state_err, response) {
            if (!response || !response.state) {
              return callback(new Error('undefined next state error'))
            }
            seneca.act('role: sm, change: state', {context: context, nextState: response.state}, function (err) {
              return callback(err, commandResponse)
            })
          })
        })
      },
      after_command: function (callback) {
        if (!afterCommand) {
          return callback()
        }
        seneca.act(afterCommand.pattern, function (err, data) {
          callback(err, data)
        })
      }
    }, function (err, results) {
      // the "command" results are returned, the "before_command" and "after_command" ones are not returned
      done(err, results.command)
    })
  }

  function init (args, done) {
    seneca.use(StateHelper)
    done()
  }

  seneca
    .add('role: sm, create: instance', create)
    .add('role: sm, close: instance', close)
    .add('role: sm, get: context', get_context)
    .add('role: sm, load: state', load_state)
    .add('init: sm', init)

  return {
    name: 'sm'
  }
}
