function truthyFunction() { return true; };
function emptyPromise() { return new Promise((resolve) => { resolve(); })};

// i should add a way to log activities.

module.exports = function stateMachinePlugin(schema, options) {
  if (options.save == undefined) {
    options.save = true;
  }
  if (options.default == undefined) {
    options.default = 'pending';
  }
  if (options.field == undefined) {
    options.field = 'state';
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

  var fieldObject = {};
  fieldObject[options.field] = field;

  schema.add(fieldObject);

  schema.methods.selectTransition = function(name) {
    return options.machine[this.state].transitions[name];
  }

  schema.methods.invoke = function(name, ...args) {
    var action = options.machine[this.state].actions[name];
    return action.apply(this, args); 
  }

  schema.methods.transition = function(...args) {
    var self = this;
    var setOfTransitions = args[0];
    if (Array.isArray(setOfTransitions)) {
	setOfTransitions = args.shift();
   
      return new Promise(async(resolve, reject) => {
	//console.log('transitions:', setOfTransitions);
	//console.log('args', args);

	var results = [];

	while(setOfTransitions.length > 0) {
          var transition = setOfTransitions.shift();
	  //console.log('->', transition, args);
	  
	  var result =  await self.applyStep(transition, ...args)
	   .catch(function assembleError(innerError) {
	     innerError.cause.results = results;
	     reject(innerError);
	  }); 

	  if (result != undefined) {
	    results.push(result);
	  }
	  //console.log('result',result);
	}
	resolve(results);

      })
    } else {
      return this.applyStep(...args);
    }
  }

  schema.methods.applyStep = function(...args) {
    var model = this;

    //console.log('transitioning',model);
    var name;

    var opts = args.shift();
    //console.log(opts, args);

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

      if (opts.verbose) {
	console.log('transition', change);
      }

      if (change != undefined) {
	change = [
	  'before', 
	  'guard', 
	  'action', 
	  'after'
	].reduce((transition, functionName) => {
	  if (transition[functionName] == undefined) {
	    transition[functionName] = emptyPromise; 
	  }

	  return transition;
	}, change);


	// i don't really know if I want to pass a result between these functions.  
	
	// I like the being able to pass args into the 'action' but I don't know 
	// what should be passed in if I share a context between those functions 
	// that is any different than 'this'.  

	change.before.apply(model).then(() => {
	  change.guard.apply(model).then(() => {
	    model.state = change.target;
	    change.action.apply(model, args).then((result) => {
	      if (opts.save) {
		model.save().then(() => {
		  //console.log('transitioned',model);
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

	var data = {
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

	data.synopsis = synopsis;

	var message = "Transition of a "+synopsis.class+" from '"+synopsis.from+"' to '"+synopsis.to+"' is not allowed or doesn't exist";
	var error = new Error(message, {cause: data})

	reject(error);

      }
    });

  } 

};




