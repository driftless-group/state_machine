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
          transitions: {
            active: {
              target: 'active'
            }
          }
        }
      }
    })

    module.exports.OrderSchema = schema;
    mongoose.models.Order || mongoose.model('Order', schema);
    module.exports.Order = mongoose.models.Order;

```
