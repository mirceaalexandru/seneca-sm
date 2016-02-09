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

suite('load state into state-machine tests', function () {
  var seneca

  before({}, function (done) {
    Util.init({}, function (err, si) {
      expect(err).to.not.exist()

      seneca = si
      done()
    })
  })

  function verifyState (state, callback) {
    seneca.act("role:'sm', get:context, sm_name:" + Util.config.name, function (err, context) {
      expect(err).to.not.exist()
      expect(context).to.exist()
      expect(context.current_status).to.equal(state)

      callback(err)
    })
  }

  test('load state', function (done) {
    Async.series({
      create_instance: function (callback) {
        seneca.act("role: 'sm', create: 'instance'", Util.config, function (err) {
          expect(err).to.not.exist()

          callback(err)
        })
      },
      init: function (callback) { verifyState('INIT', callback) },
      load_state: function (callback) {
        var loadState = 'CONNECTED'
        seneca.act('role:sm, load: state', { sm_name: Util.config.name, state: loadState }, function (err, context) {
          expect(context).to.exist()
          expect(context.current_status).to.equal(loadState)

          callback(err)
        })
      },
      load_disconnect: function (callback) {
        // move from CONNECTED to DISCONNECTED
        seneca.act('role:sm, cmd: disconnect', {sm_name: Util.config.name, shouldFail: false}, function (err, data) {
          expect(err).to.not.exist()
          expect(data).to.exist()

          callback(err)
        })
      },
      disconnected: function (callback) { verifyState('DISCONNECTED', callback) }
    },
    function (err, results) {
      expect(err).to.not.exist()
      done()
    })
  })
})
