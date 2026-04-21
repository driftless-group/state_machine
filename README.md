# state_machine

```bash
  npm install @drifted/state_machine --save
```

```javascript
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

    schema.plugin(require('@drifted/state_machine'), {
      states: [
        'pending', 
        'active', 
        'cancelled', 
        'complete'
      ],

      machine: {
        pending: {
          active: {
            target: 'active'
          }
        },
        active: {
          end: {
            target: 'complete'
          }
        }
      }
    })

    module.exports.OrderSchema = schema;
    mongoose.models.Order || mongoose.model('Order', schema);
    module.exports.Order = mongoose.models.Order;

```


```javascript
   const path = require('path');
   const { Order } = require(path.join(__dirname, 'order'));


   var order = new Order({})
   order.change('active').then(() => {
     console.log(order);
   })

```

[![Run Tests](https://github.com/driftless-group/state_machine/actions/workflows/test.yml/badge.svg)](https://github.com/driftless-group/state_machine/actions/workflows/test.yml)
