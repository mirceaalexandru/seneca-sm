var _ = require('lodash')
var Async = require('async')
var Parambulator = require('parambulator')

module.exports = function (options) {
  var seneca = this

  function findNextState (args, done) {
    var command = args.command
    var err = args.err
    var data = args.data

    var next = command.next
    if (err) {
      return done(null, {state: next.error})
    }

    if (_.isString(next.success)) {
      return done(null, {state: next.success})
    }
    else if (_.isArray(next.success)) {
      var lst = []
      for (var i in next.success) {
        lst.push({
          schema: next.success[i].schema,
          state: next.success[i].state,
          response: data
        })
      }
      Async.map(lst, validate, function (err, responses) {
        if (err) {
          return done()
        }

        for (var i in responses) {
          if (responses[i]) {
            return done(null, {state: responses[i]})
          }
        }
        return done(null, {state: next.error})
      })
    }

    function validate (data, done) {
      var paramcheck = Parambulator(data.schema)
      paramcheck.validate(data.response, function (err) {
        if (err) {
          return done()
        }
        return done(null, {state: data.state})
      })
    }
  }

  function changeState (args, done) {
    var context = args.context
    var nextState = args.nextState
    console.log('Change state', context.current_status, '\t--->\t', nextState)
    context.current_status = nextState
    done(null, context)
  }

  seneca
    .add('role: sm, change: state', changeState)
    .add('role: sm, find: nextState', findNextState)

  return {
    name: 'sm-state'
  }
}
