var path = require('path');
const mongoose = require('mongoose');

const schema = new mongoose.Schema({ 
  description: {
    type: String 
  },
  shipping_address: {
    ref: 'Address', 
    type: mongoose.Schema.Types.ObjectId 
  },
  
  billing_address: {
    ref: 'Address', 
    type: mongoose.Schema.Types.ObjectId 
  }
 
}, {
  timestamps: true
});


schema.methods.add = function(item) {
  return new Promise((resolve, reject) => {
       
    resolve();
  })
}

schema.plugin(require(path.join(__dirname, '..')), {
  verbose: true,
  states: [
    'pending', 
    'active', 
    'cancelled', 
    'complete'
  ],

  machine: {
    pending: {
      transitions: {
        active: {
          target: 'active'
        }
      }
    }
  }
});


module.exports.OrderSchema = schema;

mongoose.models.Order || mongoose.model('Order', schema);
module.exports.Order = mongoose.models.Order;
