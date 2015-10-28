A simple state-machine plugin implementation for Seneca
========================================================

## Seneca State-Machine Plugin

This plugin stores a state-machine context. The state machine have two main concepts: States and Commands. At each moment
the state machine can be in one single state. In each state there can be defined one or more commands, result of these commands
changing the state of the state machine.

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


### Configuration

Configuration structure for state machine is:

 * _validate_ if configuration will be strict validated when instance is created.
 * _name_ name of the state machine - it will be used as role configuration when state machine actions will be called
 * _state_ a states array defining the possible states. This is optional, if present then it will be used to validate the configured commands transitions
 * _commands_ array defining the commands that this state machine accepts
   * _cmd_ name of the command
   * _state_ current state accepting the command
   * _pattern_ seneca pattern defining the action to be called
   * _next_ define transitions based on seneca action result
     * _err_ define next status in case of error - this is a String
     * _success_ value can be:
       * String in this case defines next status in case that Seneca action defined by pattern returns success data
       * Array of objects with following structure
         * _schema_ Parambulator schema to be applied on callback data
         * _state_ next state in case Parambulator schema matches data


### Example

The following simple state machine will be used as example.

![Diagram](https://github.com/mirceaalexandru/seneca-sm/blob/master/doc/diagram.png)

The configuration to be used for this state machine is:


```javascript
{
  validate: true,
  name:     'sm1',
  states:   [
    "INIT",
    "NOT_CONFIGURED",
    "CONNECTED",
    "DISCONNECTED"
  ],
  commands: [
    {
      cmd:   "execute",
      state: "INIT",
      pattern: "role: 'transport', execute: 'connect'",
      next:  {
        error:   "INIT",
        success: "NOT_CONFIGURED"
      }
    },
    {
      cmd:   'execute',
      state: "NOT_CONFIGURED",
      pattern: "role: 'transport', send: 'config'",
      next:  {
        error:   "DISCONNECTED",
        success: "CONNECTED"
      }
    },
    {
      cmd:   'execute',
      state: "CONNECTED",
      pattern: "role: 'transport', send: 'some_command'",
      next:  {
        error:   "DISCONNECTED",
        success: "CONNECTED"
      }
    },
    {
      cmd:   'execute',
      state: "DISCONNECTED",
      pattern: "role: 'transport', execute: 'cleanup'",
      next:  {
        error:   "INIT",
        success: "INIT"
      }
    }
  ]
}
```

