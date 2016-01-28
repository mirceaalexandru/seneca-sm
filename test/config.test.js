'use strict'

var Async = require('async')

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before
var Code = require('code')
var expect = Code.expect

var Util = require('./util.js')

var config1 = {
  name: 'sm1',

  states: {
    INIT: {
      initState: true,
      defaults: {
        pattern: "role: 'transport', execute: 'connect'",
        next: {
          error: 'INIT'
        }
      },
      commands: {
        execute: {
          next: {
            success: 'INIT'
          }
        }
      }
    }
  }
}

var config2 = {
  name: 'sm2',
  states: {
    INIT: {
      defaults: {
        pattern: "role: 'transport', execute: 'connect'",
        next: {
          error: 'INIT'
        }
      },
      commands: {
        execute: {
          next: {
            success: 'INIT'
          }
        }
      }
    }
  }
}

suite('state-machine suite tests', function () {
  var seneca

  before({}, function (done) {
    Util.init({}, function (err, si) {
      expect(err).to.not.exist()

      seneca = si
      done()
    })
  })

  test('config defaults', function (done) {
    Async.series({
      create_instance: function (callback) {
        seneca.act("role: 'sm', create: 'instance'", config1, function (err) {
          expect(err).to.not.exist()
          callback(err)
        })
      },

      verify_defaults: function (callback) {
        seneca.act("role: '" + Util.config.name + "', get: 'context'", function (err, context) {
          expect(err).to.not.exist()
          expect(context.config.states.INIT).to.exist()
          expect(context.config.states.INIT.commands).to.exist()
          expect(context.config.states.INIT.commands.execute).to.exist()
          expect(context.config.states.INIT.commands.execute.pattern).to.equal(config1.states.INIT.defaults.pattern)
          expect(context.config.states.INIT.commands.execute.next).to.exist()
          expect(context.config.states.INIT.commands.execute.next.success).to.exist()
          expect(context.config.states.INIT.commands.execute.next.error).to.exist()
          expect(context.config.states.INIT.commands.execute.next.error).to.equal(config1.states.INIT.defaults.next.error)

          callback(err)
        })
      }
    },
    function (err, results) {
      expect(err).to.not.exist()
      done()
    })
  })
})

suite('state-machine duplicate suite tests', function () {
  var seneca

  before({}, function (done) {
    Util.init({}, function (err, si) {
      expect(err).to.not.exist()

      seneca = si
      done()
    })
  })

  test('start duplicate sm', function (done) {
    Async.series({
      create_instance: function (callback) {
        seneca.act("role: 'sm', create: 'instance'", config1, function (err) {
          expect(err).to.not.exist()
          callback(err)
        })
      },
      create_duplicate_instance: function (callback) {
        seneca.act("role: 'sm', create: 'instance'", config1, function (err) {
          expect(err).to.exist()
          expect(err.orig.code).to.equal('SM already exists')
          callback()
        })
      }
    },
    function (err, results) {
      expect(err).to.not.exist()

      done()
    })
  })

  test('start duplicate sm', function (done) {
    Async.series({
      remove_instance: function (callback) {
        seneca.act("role: 'sm', close: 'instance'", {name: config1.name}, function (err) {
          expect(err).to.not.exist()
          callback(err)
        })
      },
      create_duplicate_instance: function (callback) {
        seneca.act("role: 'sm', create: 'instance'", config1, function (err) {
          expect(err).to.not.exist()
          callback(err)
        })
      }
    },
    function (err, results) {
      expect(err).to.not.exist()

      done()
    })
  })
})

suite('state-machine no initialState tests', function () {
  var seneca

  before({}, function (done) {
    Util.init({}, function (err, si) {
      expect(err).to.not.exist()

      seneca = si
      done()
    })
  })

  test('start duplicate sm', function (done) {
    Async.series({
      create_instance: function (callback) {
        seneca.act("role: 'sm', create: 'instance'", config2, function (err) {
          expect(err).to.exist()
          expect(err.orig.code).to.equal('One single state should have initState: true')
          callback()
        })
      }
    },
    function (err, results) {
      expect(err).to.not.exist()
      done()
    })
  })
})
