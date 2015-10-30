var _ = require( 'lodash' )
var async = require( 'async' )
var parambulator = require( 'parambulator' )


function State( si, context ) {
  this.seneca = si
  this.context = context
}

State.prototype.findNextState = function( command, err, data, done ) {
  var next = command.next
  if( err ) {
    return done( null, next.error )
  }

  if( _.isString( next.success ) ) {
    return done( null, next.success )
  }
  else if( _.isArray( next.success ) ) {
    var lst = []
    for( var i in next.success ) {
      lst.push( {
        schema: next.success[i].schema,
        state: next.success[i].state,
        response: data
      } )
    }
    async.map( lst, validate, function( err, responses ) {
      for( var i in responses ) {
        if( responses[i] ) {
          return done( null, responses[i] )
        }
      }
      return done( null, next.error )
    } )
  }

  function validate( data, done ) {
    var paramcheck = parambulator( data.schema )
    paramcheck.validate( data.response, function( err ) {
      if( err ) {
        return done()
      }
      return done( null, data.state )
    } )
  }
}


State.prototype.change = function( nextState ) {
  console.log( 'Change state', this.context.state, '\t--->\t', nextState )
  this.context.current_status = nextState
}


module.exports = State