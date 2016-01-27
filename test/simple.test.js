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

suite('state-machine suite tests ', function () {
  var seneca

  before({}, function (done) {
    Util.init({}, function (err, si) {
      expect(err).to.not.exist()

      seneca = si
      done()
    })
  })

  test('simple flow', function (done) {
    Async.series({
      create_instance: function (callback) {
        seneca.act("role: 'sm', create: 'instance'", Util.config, function (err, context) {
          expect(err).to.not.exist()
          callback(err)
        })
      },

      // GO TO NOT_CONFIGURED
      go_to_connected: function (callback) {
        seneca.act("role: '" + Util.config.name + "', cmd: 'execute'", {shouldFail: false}, function (err, data) {
          expect(err).to.not.exist()
          expect(data).to.exist()
          expect(data.connect).to.exist()
          callback(err)
        })
      },
      verify_connected: function (callback) {
        seneca.act("role: '" + Util.config.name + "', get: 'context'", function (err, context) {
          expect(err).to.not.exist()
          expect(context).to.exist()
          expect(context.current_status).to.equal('NOT_CONFIGURED')
          callback(err)
        })
      },

      // GO TO CONNECTED
      go_to_configured: function (callback) {
        seneca.act("role: '" + Util.config.name + "', cmd: 'execute'", {shouldFail: false}, function (err, data) {
          expect(err).to.not.exist()
          expect(data).to.exist()
          console.log('######################', data)
          expect(data.connect).to.not.exist()
          expect(data.configure).to.exist()
          callback(err)
        })
      },
      verify_configured: function (callback) {
        seneca.act("role: '" + Util.config.name + "', get: 'context'", function (err, context) {
          expect(err).to.not.exist()
          expect(context).to.exist()
          expect(context.current_status).to.equal('CONNECTED')
          callback(err)
        })
      },

      // STAY CONFIGURED
      stay_configured: function (callback) {
        seneca.act("role: '" + Util.config.name + "', cmd: 'execute'", {shouldFail: false}, function (err, data) {
          expect(err).to.not.exist()
          expect(data).to.exist()
          expect(data.connect).to.not.exist()
          callback(err)
        })
      },
      verify_configured_again: function (callback) {
        seneca.act("role: '" + Util.config.name + "', get: 'context'", function (err, context) {
          expect(err).to.not.exist()
          expect(context).to.exist()
          expect(context.current_status).to.equal('CONNECTED')
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
