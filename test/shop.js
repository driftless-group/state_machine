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
  strict: false, 
  verbose: false,
  machine: {
    pending: {
      active: {
        target: 'active',
        action: function() {
          return new Promise((resolve) => {
            resolve(false);
          })
        }
      }
    }
  }
});


module.exports.ShopSchema = schema;

mongoose.models.Shop || mongoose.model('Shop', schema);
module.exports.Shop = mongoose.models.Shop;
