const assert   = require('assert');
const path     = require('path');
const mongoose = require('mongoose');
var {
  exception
} = require('@drifted/qa');

require('@drifted/env/test')
require('@drifted/db');

var { Order } = require(path.join(__dirname, 'order'));
var { Shop } = require(path.join(__dirname, 'shop'));

console.log('NODE_ENV', process.env.NODE_ENV);
console.log('MONGO_URL', process.env.MONGO_URL);

describe('state_machine', () => {

  before((done) => {
    Order.deleteMany({}).then(() => {
      done();
    })
  })

  after((done) => {
    done();
  })
  
  it('strict: create a new order and have it have a state and change', function(done) {
    var order = new Order({})
    
    order.save().then(() => {
      assert.equal(order.state, 'pending');
      order.change('active').then(() => {
        assert.equal(order.state, 'active');
        done();
      }).catch(exception(done));

    }).catch(exception(done));
  })


  it('strict: create a new order and change multiple states', function(done) {
    var order = new Order({})
    
    order.save().then(() => {
      assert.equal(order.state, 'pending');
      order.change('active', 'cancel').then(() => {
        assert.equal(order.state, 'cancelled');
        done();
      }).catch(exception(done));

    }).catch(exception(done));
  })

  it('strict: cant transition to an invalid state', function(done) {
    var order = new Order({})
    
    order.save().then(() => {
      assert.equal(order.state, 'pending');
      order.change('active').then(() => {
        order.change('end').then(() => {
          assert.equal(order.state, 'complete')
          done();
        }).catch(exception(done));
      });

    }).catch(exception(done));
  })


  it('strict: cant transition to an invalid state', function(done) {
    var order = new Order({})
    
    order.save().then(() => {
      assert.equal(order.state, 'pending');
      order.change('complete').then(() => {
        done();
      }).catch(function(error) {
        //console.log('error',error.message);
        assert.equal(error.cause.success, false);
        assert.equal(error.cause.autopsy.event, 'complete');
        assert.equal(error.cause.autopsy.args.length, 0);
        
        assert.equal(error.cause.synopsis.class, 'Order');
        assert.equal(error.cause.synopsis.from, 'pending');
        assert.equal(error.cause.synopsis.to, 'complete');
        assert.equal(error.cause.synopsis.existing, false);
        
        done();
      });

    }).catch(exception(done));
  })

  it('unstrict: can transition to whatever state: existing', function(done) {
    var shop = new Shop({})
    
    shop.save().then(() => {
      assert.equal(shop.state, 'pending');
      
      shop.change('active').then(() => {
        assert.equal(shop.state, 'active');
        done();
      });

    }).catch(exception(done));
  })


  it('unstrict: can transition to whatever state: not existing', function(done) {
    var shop = new Shop({})
    
    shop.save().then(() => {
      assert.equal(shop.state, 'pending');
      
      shop.change('condemned').then(() => {
        assert.equal(shop.state, 'condemned');
        done();
      });

    }).catch(exception(done));
  })

})





