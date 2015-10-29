"use strict"

var _ = require( 'lodash' )

module.exports = function( options ) {
  var seneca = this;

  var name = 'mite'
  var sm = {}

  function create( args, done ) {
    var config = args.config
    var sm_name = config.name

    if( sm[sm_name] ) {
      return done( 'SM already exists' )
    }

    var validate_error = validate_configuration(config)
    if (validate_error){
      return done( validate_error )
    }

    config = _.clone(config)
    var context = {
      config: config,
      commands: {}
    }
    sm[sm_name] = context

    for( var state_name in config.states ) {
      if( config.states[state_name].initState ) {
        context.state = state_name
      }

      for( var command_name in config.states[state_name].commands ) {
        if( context.commands[command_name] ) {
          // this command was already registered
          continue
        }

        context.commands[command_name] = {
          // future data?
        }

        seneca
          .add( {role: sm_name, cmd: command_name}, execute_state )

        // now process defaults
        if (config.states[state_name].defaults){
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

    seneca
      .add( {role: sm_name, get: 'context'}, get_context )

    done()
  }

  function validate_configuration(config){
    var initStateOK = false

    for (var i in config.states){
      if (config.states[i].initState){
        if (initStateOK){
          return 'One single state should have initState: true'
        }
        initStateOK = true
      }
    }
    if (!initStateOK){
      return 'One single state should have initState: true'
    }
    return
  }


  function retrieve_command( args, context ) {
    if ( context.config.states[context.state].commands[args.cmd] ){
      return context.config.states[context.state].commands[args.cmd]
    }
    return
  }

  function execute_state( args, done ) {
    var context = sm[args.role]

    if( !context ) {
      return done( 'Invalid state-machine id' )
    }

    var command = retrieve_command( args, context )
    delete args.role
    delete args.cmd
    seneca.act( command.pattern, args, function( err, data ) {
      findNextState( command, err, data, function( state_err, nextState ) {
        changeState( context, nextState )
        done( err, data )
      } )
    } )
  }

  function get_context( args, done ) {
    var context = sm[args.role]

    if( !context ) {
      return done( 'Invalid state-machine id' )
    }
    done( null, _.clone( context ) )
  }

  function changeState( context, nextState ) {
    console.log('Change state', context.state, '--->', nextState)
    context.state = nextState
  }

  function findNextState( command, err, data, done ) {
    var next = command.next
    if( err ) {
      return done( null, next.err )
    }
    return done( null, next.success )
  }

  seneca
    .add( {role: 'sm', create: 'instance'}, create )
}