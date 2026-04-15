const assert   = require('assert');
const path     = require('path');
const mongoose = require('mongoose');
var {
  doneMessage
} = require('@drifted/qa');

process.env.NODE_ENV = 'test';

require('dotenv').config({path: path.join(__dirname, '.env')});
var { Order } = require(path.join(__dirname, 'order'));
require('@drifted/qa/db');

describe('state_machine', () => {
  before((done) => {
    Order.deleteMany({}).then(() => {
      done();
    })
  })

  after((done) => {
    done();
  })

  it('create a new order and have it have a state and transition', function(done) {
    var order = new Order({})
    
    order.save().then(() => {
      assert.equal(order.state, 'pending');

      order.transition('active').then(() => {
        done();
      }).catch(doneMessage(done));

    }).catch(doneMessage(done));
  })

  it('cant tranisition to an invalid state', function(done) {
    var order = new Order({})
    
    order.save().then(() => {
      assert.equal(order.state, 'pending');
      order.transition('complete').then(() => {
        done();
      }).catch(function(error) {
        assert.equal(error.cause.success, false);
        assert.equal(error.cause.autopsy.event, 'complete');
        assert.equal(error.cause.autopsy.args.length, 0);
        
        assert.equal(error.cause.synopsis.class, 'Order');
        assert.equal(error.cause.synopsis.from, 'pending');
        assert.equal(error.cause.synopsis.to, 'complete');
        assert.equal(error.cause.synopsis.existing, false);
        
        done();
      });

    }).catch(doneMessage(done));
  })
})





