
exports.states = {
  INIT: 'INIT',
  CONNECTED: 'CONNECTED',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  DISCONNECTED: 'DISCONNECTED'
}

exports.config = {
  validate: true,
  name: 'sm1',

  states: {
    events: {
      before: {
        pattern: "role: 'transport', execute: 'before_state_change'"
      },
      after: {
        pattern: "role: 'transport', execute: 'after_state_change'"
      }
    },
    INIT: {
      initState: true,
      defaults: {
        next: {
          error: 'INIT'
        }
      },
      commands: {
        execute: {
          pattern: "role: 'transport', execute: 'connect'",
          next: {
            success: 'NOT_CONFIGURED'
          }
        },
        disconnect: {
          pattern: "role: 'transport', execute: 'disconnect'",
          next: {
            success: 'INIT'
          }
        }
      }
    },
    NOT_CONFIGURED: {
      commands: {
        execute: {
          pattern: "role: 'transport', send: 'config'",
          next: {
            error: 'DISCONNECTED',
            success: 'CONNECTED'
          }
        },
        disconnect: {
          pattern: "role: 'transport', execute: 'disconnect'",
          next: {
            success: 'DISCONNECTED'
          }
        }
      },
      events: {
        before: {
          pattern: "role: 'transport', execute: 'before_notconfigured_state_change'"
        },
        after: {
          pattern: "role: 'transport', execute: 'after_notconfigured_state_change'"
        }
      }
    },
    CONNECTED: {
      commands: {
        execute: {
          pattern: "role: 'transport', send: 'some_command'",
          next: {
            error: 'DISCONNECTED',
            success: 'CONNECTED'
          }
        },
        disconnect: {
          pattern: "role: 'transport', execute: 'disconnect'",
          next: {
            success: 'DISCONNECTED'
          }
        }
      }
    },
    DISCONNECTED: {
      commands: {
        execute: {
          pattern: "role: 'transport', execute: 'cleanup'",
          next: {
            error: 'INIT',
            success: 'INIT'
          }
        }
      }
    }
  }
}

exports.init = function (options, cb) {
  var si = require('seneca')(/* {log: 'print'} */)
  si.use(require('../lib/sm.js'))

  si.add({role: 'transport', execute: 'connect'}, function (args, done) {
    if (args.shouldFail) {
      return done('Some error')
    }
    done(null, {data: 'OK', connect: true})
  })

  si.add({role: 'transport', execute: 'disconnect'}, function (args, done) {
    if (args.shouldFail) {
      return done('Some error')
    }
    done(null, {data: 'OK', connect: true})
  })

  si.add({role: 'transport', send: 'config'}, function (args, done) {
    if (args.shouldFail) {
      return done('Some error')
    }
    done(null, {data: 'OK', configure: true})
  })

  si.add({role: 'transport', send: 'some_command'}, function (args, done) {
    if (args.shouldFail) {
      return done('Some error')
    }
    done(null, {data: 'OK', command: true})
  })

  si.add({role: 'transport', execute: 'before_state_change'}, function (args, done) {
    if (args.shouldFail) {
      return done('Some error')
    }
    done(null, {data: 'OK', before: true})
  })

  si.add({role: 'transport', execute: 'after_state_change'}, function (args, done) {
    if (args.shouldFail) {
      return done('Some error')
    }
    done(null, {data: 'OK', after: true})
  })

  si.add({role: 'transport', execute: 'before_notconfigured_state_change'}, function (args, done) {
    if (args.shouldFail) {
      return done('Some error')
    }
    done(null, {data: 'OK', before_notconfigured: true})
  })

  si.add({role: 'transport', execute: 'after_notconfigured_state_change'}, function (args, done) {
    if (args.shouldFail) {
      return done('Some error')
    }
    done(null, {data: 'OK', after_notconfigured: true})
  })

  cb(null, si)
}
