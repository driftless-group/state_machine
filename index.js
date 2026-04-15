function truth() { return true; };
function falsity() { return new Promise((resolve) => { resolve(); })};

// i should add a way to log activities.

module.exports = function stateMachinePlugin(schema, options={}) {
  if (options.strict == undefined) {
    options.strict = true;
  }

  if (options.save == undefined) {
    options.save = true;
  }

  if (options.default == undefined) {
    options.default = 'pending';
  }

  if (options.field == undefined) {
    options.field = 'state';
  }

  if (options.states == undefined) {
    options.states = ['pending', 'complete', 'active', 'cancelled'];
  }

  var field = {
    type: String,
    enum: options.states,
    required: true,
    default: options.default
  }

  if (options.states == undefined) {
    field.enum = options.states;
  }

  if (options.verbose) {
    console.log('state_machine:options',options);
  }

  var fieldObject = {};
  fieldObject[options.field] = field;

  schema.add(fieldObject);

  schema.methods.selectTransition = function(name) {
    if (options.verbose) {
      console.log('transitions:select', this.state, '~>', name);
    }
    
    var transition = options.machine[this.state].transitions[name];
    if (options.strict == false && options.states.indexOf(name) > -1) {
      transition = {target: name};
    }

    if (options.verbose) {
      console.log('transition:triage', transition);
    }
    
    return transition;
  }

  schema.methods.invoke = function(name, ...args) {
    var action = options.machine[this.state].actions[name];
    return action.apply(this, args); 
  }

  schema.methods.transition = function(...args) {
    var self = this;
    var setOfTransitions = args[0];
    
    if (options.verbose) {
      console.log('transition:set',setOfTransitions);
    }

    if (Array.isArray(setOfTransitions)) {
      setOfTransitions = args.shift();

      return new Promise(async(resolve, reject) => {
        //console.log('args', args);

        var results = [];

        while(setOfTransitions.length > 0) {
          var transition = setOfTransitions.shift();
          if (options.verbose) {
            console.log('->', transition, args);
          }

          var result =  await self.applyStep(transition, ...args)
            .catch(function assembleError(innerError) {
              innerError.cause.results = results;
              reject(innerError);
            }); 

          if (result != undefined) {
            results.push(result);
          }


        }
        if (options.verbose) {
          console.log('results',results);
        }
        resolve(results);

      })
    } else {
      if (options.verbose) {
        console.log('transition:not_array', args);
      }
      return this.applyStep(...args);
    }
  }

  schema.methods.applyStep = function(...args) {
    var model = this;
    var name;
    var opts = args.shift();

    if (typeof opts == 'string') {
      name = opts; 
      opts = {};
    } else {
      name = opts.name;
      delete opts.name
    }

    if (opts.save == undefined) {
      opts.save = options.save;
    }

    return new Promise(function applyFilters(resolve, reject) {
      var change = model.selectTransition(name);

      if (options.verbose) {
        console.log('transition:apply_step', change);
      }

      if (change != undefined) {
        change = [
          'before', 
          'guard', 
          'action', 
          'after'
        ].reduce((transition, functionName) => {
          if (transition[functionName] == undefined) {
            transition[functionName] = falsity; 
          }

          return transition;
        }, change);


        // i don't really know if I want to pass a result 
        // between these functions.  I like the being able 
        // to pass args into the 'action' but I don't know 
        // what should be passed in if I share a context 
        // between those functions that is any different 
        // than 'this'.  

          change.before.apply(model).then(() => {
            change.guard.apply(model).then(() => {
              console.log(change);
              model.state = change.target;
              change.action.apply(model, args).then((result) => {
                if (options.verbose) {
                  console.log('transition:saving', model);
                }
                if (opts.save) {
                  model.save().then(() => {
                    change.after.apply(model).then(() => {
                      resolve(result != undefined ? result : true);
                    }).catch(reject);
                  }).catch(reject);
                } else {
                  change.after.apply(model).then(() => {
                    resolve(result != undefined ? result : true);
                  }).catch(reject);
                }
              }).catch(reject);
            }).catch(reject);
          }).catch(reject);

      } else {

        var cause = {
          success: false,
          autopsy: {
            event: name,
            args: args, 
            model: model
          }
        };

        synopsis = {
          class: model.constructor.modelName,
          from: model.state,
          to: name,
          existing: false
        }

        cause.synopsis = synopsis;

        var message = "Transition of a "+
          synopsis.class + " from '"+
          synopsis.from + "' to '"+
          synopsis.to + "' is not allowed or doesn't exist";

        var error = new Error(message, {cause})
        reject(error);

      }
    });
  } 

};




