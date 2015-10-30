"use strict"

var Configuration = require( "./rules" )
var State = require( './state' )
var _ = require( 'lodash' )

module.exports = function( options ) {
  var seneca = this;

  var sm = {}

  function create( args, done ) {
    var rules = new Configuration( args )
    var sm_name = rules.config.name

    if( sm[sm_name] ) {
      return done( 'SM already exists' )
    }

    var validate_error = rules.validate()
    if( validate_error ) {
      return done( validate_error )
    }

    var context = {
      rules: rules,
      commands: {}
    }
    context.status = new State( seneca, context )

    sm[sm_name] = context

    context.current_status = rules.getInitState()

    // now process defaults
    rules.processDefaults()

    var cmds = rules.getCommands()
    for( var command_name in cmds ) {
      if( context.commands[command_name] ) {
        // this command was already registered
        continue
      }

      context.commands[command_name] = cmds[command_name]

      seneca
        .add( {role: sm_name, cmd: command_name}, execute_state )
    }

    seneca
      .add( {role: sm_name, get: 'context'}, get_context )

    done()
  }


  function get_context( args, done ) {
    var context = sm[args.role]

    if( !context ) {
      return done( 'Invalid state-machine id' )
    }
    done( null, _.clone( context ) )
  }

  function execute_state( args, done ) {
    var context = sm[args.role]
    var command = context.rules.retrieve_command( context.current_status, args.cmd )

    delete args.role
    delete args.cmd

    seneca.act( command.pattern, args, function( err, data ) {
      context.status.findNextState( command, err, data, function( state_err, nextState ) {
        context.status.change( nextState )
        done( err, data )
      } )
    } )
  }


  seneca
    .add( {role: 'sm', create: 'instance'}, create )
}