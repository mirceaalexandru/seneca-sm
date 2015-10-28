var assert = require( 'assert' )

exports.states = {
  INIT        : 'INIT',
  CONNECTED   : 'CONNECTED',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  DISCONNECTED: 'DISCONNECTED'
}

exports.config = {
  validate: true,
  name:     'sm1',
  states:   [
    exports.states.INIT,
    exports.states.NOT_CONFIGURED,
    exports.states.CONNECTED,
    exports.states.DISCONNECTED
  ],
  commands: [
    {
      cmd:   'execute',
      state: exports.states.INIT,
      pattern: "role: 'transport', execute: 'connect'",
      next:  {
        error:   exports.states.INIT,
        success: exports.states.NOT_CONFIGURED
      }
    },
    {
      cmd:   'execute',
      state: exports.states.NOT_CONFIGURED,
      pattern: "role: 'transport', send: 'config'",
      next:  {
        error:   exports.states.DISCONNECTED,
        success: exports.states.CONNECTED
      }
    },
    {
      cmd:   'execute',
      state: exports.states.CONNECTED,
      pattern: "role: 'transport', send: 'some_command'",
      next:  {
        error:   exports.states.DISCONNECTED,
        success: exports.states.CONNECTED
      }
    },
    {
      cmd:   'execute',
      state: exports.states.DISCONNECTED,
      pattern: "role: 'transport', execute: 'cleanup'",
      next:  {
        error:   exports.states.INIT,
        success: exports.states.INIT
      }
    }
  ]
}

exports.init = function( options, cb ) {
  var si = require( 'seneca' )( /*{log: 'print'}*/ )
  si.use( require( '../lib/sm.js' ) )

  si.ready( function( err ) {
    if( err ) {
      return process.exit( !console.error( err ) );
    }

    si.add({role: 'transport', execute: 'connect'}, function(args, done){
      if (args.shouldFail){
        return done('Some error')
      }
      done(null, {data: 'OK', connect: true})
    })

    si.add({role: 'transport', send: 'config'}, function(args, done){
      if (args.shouldFail){
        return done('Some error')
      }
      done(null, {data: 'OK', configure: true})
    })

    si.add({role: 'transport', send: 'some_command'}, function(args, done){
      if (args.shouldFail){
        return done('Some error')
      }
      done(null, {data: 'OK', command: true})
    })

    cb( null, si )
  } )
}

