"use strict"

var _ = require( 'lodash' )

module.exports = function ( options ) {
  var seneca = this;
  var name = 'mite'
  var sm = {}

  function create( args, done ) {
    var config = args.config
    var sm_name = config.name

    if ( sm[sm_name] ) {
      return done( 'SM already exists' )
    }

    var context = {
      config:   config,
      state:    config.states[0],
      commands: []
    }
    sm[sm_name] = context

    for ( var i in config.commands ) {
      if ( context.commands[config.commands[i].cmd] ) {
        // this command was already registered
        continue
      }

      context.commands[config.commands[i].cmd] = {
        // future data?
      }

      seneca
        .add( {role: sm_name, cmd: config.commands[i].cmd}, execute_state )
        .add( {role: sm_name, get: 'context'}, get_context )
    }
    done()
  }

  function retrieve_command( args, context ){
    for (var i in context.config.commands){
      if (context.config.commands[i].cmd === args.cmd && context.config.commands[i].state === context.state){
        return context.config.commands[i]
      }
    }
    return
  }

  function execute_state( args, done ) {
    var context = sm[args.role]

    if ( !context ) {
      return done( 'Invalid state-machine id' )
    }

    var command = retrieve_command( args, context )
    delete args.role
    delete args.cmd
    seneca.act( command.pattern, args, function (err, data){
      findNextState( command, err, data, function(state_err, nextState){
        changeState( context, nextState)
        done( err, data )
      } )
    } )
  }

  function get_context( args, done ) {
    var context = sm[args.role]

    if ( !context ) {
      return done( 'Invalid state-machine id' )
    }
    done(null, _.clone(context))
  }

  function changeState( context, nextState){
    context.state = nextState
  }

  function findNextState( command, err, data, done ){
    var next = command.next
    if (err){
      return done( null, next.err )
    }
    return done( null, next.success )
  }

  seneca
    .add( {role: 'sm', create: 'instance'}, create )
}