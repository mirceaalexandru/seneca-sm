"use strict";

var assert = require( 'assert' )
var async = require('async')

var Lab = require( 'lab' )
var lab = exports.lab = Lab.script()
var suite = lab.suite;
var test = lab.test;
var before = lab.before;

var util = require( './util.js' )

suite( 'state-machine suite tests ', function () {
  var seneca

  before( {}, function ( done ) {
    util.init( {}, function ( err, si ) {
      seneca = si
      done()
    } )
  } )

  test( 'simple flow', function ( done ) {
    async.series( {
        create_instance: function( callback ) {
          seneca.act( "role: 'sm', create: 'instance'", {config: util.config}, function( err, context ) {
            assert( !err )
            callback( err )
          } )
        },

        // GO TO NOT_CONFIGURED
        go_to_connected: function( callback ) {
          seneca.act( "role: '" + util.config.name + "', cmd: 'execute'", {shouldFail: false}, function( err, data ) {
            assert( !err )
            assert( data )
            assert( data.connect )
            callback( err )
          } )
        },
        verify_connected: function( callback ) {
          seneca.act( "role: '" + util.config.name + "', get: 'context'", function( err, context ) {
            assert( !err )
            assert( context )
            assert.equal( context.state, "NOT_CONFIGURED" )
            callback( err )
          } )
        },

        // GO TO CONNECTED
        go_to_configured: function( callback ) {
          seneca.act( "role: '" + util.config.name + "', cmd: 'execute'", {shouldFail: false}, function( err, data ) {
            assert( !err )
            assert( data )
            assert( !data.connect )
            assert( data.configure )
            callback( err )
          } )
        },
        verify_configured: function( callback ) {
          seneca.act( "role: '" + util.config.name + "', get: 'context'", function( err, context ) {
            assert( !err )
            assert( context )
            assert.equal( context.state, "CONNECTED" )
            callback( err )
          } )
        },

        // STAY CONFIGURED
        stay_configured: function( callback ) {
          seneca.act( "role: '" + util.config.name + "', cmd: 'execute'", {shouldFail: false}, function( err, data ) {
            assert( !err )
            assert( data )
            assert( !data.connect )
            callback( err )
          } )
        },
        verify_configured_again: function( callback ) {
          seneca.act( "role: '" + util.config.name + "', get: 'context'", function( err, context ) {
            assert( !err )
            assert( context )
            assert.equal( context.state, "CONNECTED" )
            callback( err )
          } )
        }
      },
      function( err, results ) {
        done()
      } )
  } )
} )



