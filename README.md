State-machine plugin for Seneca
================================

![Seneca](http://senecajs.org/files/assets/seneca-logo.png)

# seneca-sm
[![npm version][npm-badge]][npm-url] 
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coverage-badge]][coverage-url]


## Seneca State-Machine Plugin

This plugin stores and execute a state-machine context. The state machine have two main concepts: _States_ and _Commands_.
At each moment the state machine can be in one single state.
In each state there can be defined one or more commands, result of these commands changing the state of the state machine.

## Seneca State-Machine Plugin

### Install

```sh
npm install seneca-sm
```

### Usage

#### Initialisation

```sh
seneca.act( "role: 'sm', create: 'instance'", {config: sm_configuration}, function( err, context ) {
})
```

#### Executing commands

```sh
seneca.act( "role: 'sm-name', cmd: 'command-name'", some_data, function( err, data ) {
})
```

where:
 * _sm-name_ is the name of the state-machine as it was set in the configuration
 * _command-name_ the command to be executed for current state. Should be defined in the configuration.
 * _some_data_ optional JSON containing additional-data for command


#### Retrieving state machine context

```sh
seneca.act( "role: 'sm-name', get: 'context'", function( err, context ) {
})
```

#### Set data in state-machine context

This command will set some data in the state machine context. This data will be sent to all commands executed on the state machine.

```sh
seneca.act( "role: 'sm-name', set: 'data'", some_data, function( err, context ) {
})
```

#### Remove state-machine context

This command will close the state machine. This state machine cannot be used anymore. A new state machine with same name can be started.

```sh
seneca.act( "role: 'sm-name', drop: 'instance'", function( err, context ) {
})
```


### Configuration

Configuration structure for state machine is:

 * _validate_ if configuration will be strict validated when instance is created.
 * _name_ name of the state machine - it will be used as role configuration when state machine actions will be called
 * _states_ object defining the states and commands. Key is the state and value an object with
   * _defaults_ default behavior for this state - TBD
   * _initState_ default state for state machine. One single state should have this parameter true
   * _commands_ array with all commands for current state
     * _key_ command to be executed for this state
     * _pattern_ seneca pattern defining the action to be called to execute the state
     * _next_ define transitions based on seneca action result
       * _err_ define next status in case of error - this is a String
        * _success_ value can be:
          * String in this case defines next status in case that Seneca action defined by pattern returns success data
          * Array of objects with following structure
            * _schema_ Parambulator schema to be applied on callback data
            * _state_ next state in case Parambulator schema matches data


### Example

The following simple state machine will be used as example.

![Diagram](http://www.alexandrumircea.ro/share/seneca-sm/diagram.png)

The configuration to be used for this state machine is:


```javascript
{
  validate: true,
  name:     'sm1',
  states: {
    "INIT": {
      initState: true,
      defaults: {
        next: {
          error:   "INIT"
        }
      },
      commands: {
        execute: {
          pattern: "role: 'transport', execute: 'connect'",
          next:  {
            success: "NOT_CONFIGURED"
          }
        },
        disconnect: {
          pattern: "role: 'transport', execute: 'disconnect'",
          next:  {
            success: "INIT"
          }
        }
      }
    },
    "NOT_CONFIGURED": {
      commands: {
        execute: {
          pattern: "role: 'transport', send: 'config'",
          next:  {
            error:   "DISCONNECTED",
            success: "CONNECTED"
          }
        },
        disconnect: {
          pattern: "role: 'transport', execute: 'disconnect'",
          next:  {
            error:   "INIT",
            success: "DISCONNECTED"
          }
        }
      }
    },
    "CONNECTED": {
      commands: {
        execute: {
          pattern: "role: 'transport', send: 'some_command'",
          next:  {
            error:   "DISCONNECTED",
            success: "CONNECTED"
          }
        },
        disconnect: {
          pattern: "role: 'transport', execute: 'disconnect'",
          next:  {
            error:   "INIT",
            success: "DISCONNECTED"
          }
        }
      }
    },
    "DISCONNECTED": {
      commands: {
        execute: {
          cmd:   '',
          pattern: "role: 'transport', execute: 'cleanup'",
          next:  {
            error:   "INIT",
            success: "INIT"
          }
        },
        disconnect: {
          pattern: "role: 'transport', execute: 'disconnect'",
          next:  {
            error:   "INIT",
            success: "DISCONNECTED"
          }
        }
      }
    }
  }
}
```

### Test

```sh
npm test
```

[travis-badge]: https://api.travis-ci.org/mirceaalexandru/seneca-sm.svg
[travis-url]: https://travis-ci.org/mirceaalexandru/seneca-sm
[npm-badge]: https://badge.fury.io/js/seneca-sm.svg
[npm-url]: https://badge.fury.io/js/seneca-sm
[coverage-badge]: https://coveralls.io/repos/mirceaalexandru/seneca-sm/badge.svg?branch=master&service=github
[coverage-url]: https://coveralls.io/github/mirceaalexandru/seneca-sm?branch=master

