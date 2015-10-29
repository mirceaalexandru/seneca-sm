"use strict";

var assert = require( 'assert' )
var async = require('async')

var Lab = require( 'lab' )
var lab = exports.lab = Lab.script()
var suite = lab.suite;
var test = lab.test;
var before = lab.before;

var util = require( './util.js' )

var config1 = {
  name    : 'sm1',

  states: {
    INIT : {
      initState: true,
      defaults: {
        pattern: "role: 'transport', execute: 'connect'",
        next: {
          error: 'INIT'
        }
      },
      commands: {
        execute: {
          next:  {
            success: "INIT"
          }
        }
      }
    }
  }
}

var config2 = {
  name    : 'sm2',

  states: {
    INIT : {
      defaults: {
        pattern: "role: 'transport', execute: 'connect'",
        next: {
          error: 'INIT'
        }
      },
      commands: {
        execute: {
          next:  {
            success: "INIT"
          }
        }
      }
    }
  }
}


suite( 'state-machine suite tests', function () {
  var seneca

  before( {}, function ( done ) {
    util.init( {}, function ( err, si ) {
      seneca = si
      done()
    } )
  } )

  test( 'config defaults', function ( done ) {
    async.series( {
        create_instance: function( callback ) {
          seneca.act( "role: 'sm', create: 'instance'", {config: config1}, function( err ) {
            assert( !err )
            callback( err )
          } )
        },

        verify_defaults: function( callback ) {
          seneca.act( "role: '" + util.config.name + "', get: 'context'", function( err, context ) {
            assert( !err )
            assert( context.config.states.INIT )
            assert( context.config.states.INIT.commands )
            assert( context.config.states.INIT.commands.execute )
            assert.equal( context.config.states.INIT.commands.execute.pattern, config1.states.INIT.defaults.pattern )
            assert( context.config.states.INIT.commands.execute.next )
            assert( context.config.states.INIT.commands.execute.next.success )
            assert( context.config.states.INIT.commands.execute.next.error )
            assert.equal( context.config.states.INIT.commands.execute.next.error, config1.states.INIT.defaults.next.error )

            callback( err )
          } )
        }

      },
      function( err, results ) {
        done()
      } )
  } )
})

suite( 'state-machine duplicate suite tests', function () {
  var seneca

  before( {}, function ( done ) {
    util.init( {}, function ( err, si ) {
      seneca = si
      done()
    } )
  } )

  test( 'start duplicate sm', function ( done ) {
    async.series( {
        create_instance: function( callback ) {
          seneca.act( "role: 'sm', create: 'instance'", {config: config1}, function( err ) {
            assert( !err )
            callback( err )
          } )
        },
        create_duplicate_instance: function( callback ) {
          seneca.act( "role: 'sm', create: 'instance'", {config: config1}, function( err ) {
            assert( err )
            assert.equal( err.orig.code, 'SM already exists' )
            callback(  )
          } )
        }
      },
      function( err, results ) {
        done()
      } )
  } )
} )




