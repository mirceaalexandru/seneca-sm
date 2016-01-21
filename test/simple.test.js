'use strict'

var Assert = require('assert')
var Async = require('async')

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before

var Util = require('./util.js')

suite('state-machine suite tests ', function () {
  var seneca

  before({}, function (done) {
    Util.init({}, function (err, si) {
      Assert(!err)

      seneca = si
      done()
    })
  })

  test('simple flow', function (done) {
    Async.series({
      create_instance: function (callback) {
        seneca.act("role: 'sm', create: 'instance'", Util.config, function (err, context) {
          Assert(!err)
          callback(err)
        })
      },

      // GO TO NOT_CONFIGURED
      go_to_connected: function (callback) {
        seneca.act("role: '" + Util.config.name + "', cmd: 'execute'", {shouldFail: false}, function (err, data) {
          Assert(!err)
          Assert(data)
          Assert(data.connect)
          callback(err)
        })
      },
      verify_connected: function (callback) {
        seneca.act("role: '" + Util.config.name + "', get: 'context'", function (err, context) {
          Assert(!err)
          Assert(context)
          Assert.equal(context.current_status, 'NOT_CONFIGURED')
          callback(err)
        })
      },

      // GO TO CONNECTED
      go_to_configured: function (callback) {
        seneca.act("role: '" + Util.config.name + "', cmd: 'execute'", {shouldFail: false}, function (err, data) {
          Assert(!err)
          Assert(data)
          console.log('######################', data)
          Assert(!data.connect)
          Assert(data.configure)
          callback(err)
        })
      },
      verify_configured: function (callback) {
        seneca.act("role: '" + Util.config.name + "', get: 'context'", function (err, context) {
          Assert(!err)
          Assert(context)
          Assert.equal(context.current_status, 'CONNECTED')
          callback(err)
        })
      },

      // STAY CONFIGURED
      stay_configured: function (callback) {
        seneca.act("role: '" + Util.config.name + "', cmd: 'execute'", {shouldFail: false}, function (err, data) {
          Assert(!err)
          Assert(data)
          Assert(!data.connect)
          callback(err)
        })
      },
      verify_configured_again: function (callback) {
        seneca.act("role: '" + Util.config.name + "', get: 'context'", function (err, context) {
          Assert(!err)
          Assert(context)
          Assert.equal(context.current_status, 'CONNECTED')
          callback(err)
        })
      }
    },
    function (err, results) {
      Assert(!err)
      done()
    })
  })
})
