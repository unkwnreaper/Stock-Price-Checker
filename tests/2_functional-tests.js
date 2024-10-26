const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

const mongoose = require('mongoose');

afterEach(async function () {
    const collections = await mongoose.connection.db.collections()

    for (let collection of collections) {
        await collection.drop();
    }
})



suite('Functional Tests', function() {
    this.timeout(10000);
    var likes;
    
    test('Test GET /api/stock-prices/', function(done){
        chai.request(server)
        .get('/api/stock-prices?stock=GOOG')
        .end(function(err, res){
            assert.equal(err, null, 'should be no errors');
            assert.equal(res.status, 200);
            assert.typeOf(res, 'object', 'response must be object');
            assert.equal(res.body.stockData.stock, 'GOOG', 'stock must be correct symbol');
            assert.isNumber(res.body.stockData.price, 'price must be a number');
            assert.isNumber(res.body.stockData.likes, 'likes must be a number');
            likes = res.body.stockData.likes;
            done();
        });
    });

    test('Test GET /api/stock-prices/ and like it', function(done){
        chai.request(server)
        .get('/api/stock-prices?stock=GOOG&like=true')
        .end(function(err, res){
            assert.equal(err, null, 'should be no errors');
            assert.equal(res.status, 200);
            assert.typeOf(res, 'object', 'response must be object');
            assert.equal(res.body.stockData.stock, 'GOOG', 'stock must be correct symbol');
            assert.isNumber(res.body.stockData.price, 'price must be a number');
            assert.isNumber(res.body.stockData.likes, 'likes must be a number');
            assert.equal(res.body.stockData.likes, (likes + 1), 'must be correctly incremented');
            likes += 1;
            done();
        });
    });

    test('Test GET /api/stock-prices/ and like it again', function(done){
        chai.request(server)
        .get('/api/stock-prices?stock=GOOG&like=true')
        .end(function(err, res){
            assert.equal(err, null, 'should be no errors');
            assert.equal(res.status, 200);
            assert.typeOf(res, 'object', 'response must be object');
            assert.equal(res.body.stockData.stock, 'GOOG', 'stock must be correct symbol');
            assert.isNumber(res.body.stockData.price, 'price must be a number');
            assert.isNumber(res.body.stockData.likes, 'likes must be a number');
            assert.equal(res.body.stockData.likes, likes, 'must not be incremented');
            done();
        });
    });

    test('Test GET /api/stock-prices/ for two stocks', function(done){
        chai.request(server)
        .get('/api/stock-prices?stock=GOOG&stock=MSFT')
        .end(function(err, res){
            assert.equal(err, null, 'should be no errors');
            assert.equal(res.status, 200);
            assert.typeOf(res, 'object', 'response must be object');
            assert.isArray(res.body.stockData,  'must be an array');
            assert.equal(res.body.stockData[0].stock, 'GOOG', 'stock must be correct symbol');
            assert.isNumber(res.body.stockData[0].price, 'price must be a number');
            assert.isNumber(res.body.stockData[0].rel_likes, 'likes must be a number');
            done();
        });
    });

    test('Test GET /api/stock-prices/ for two stocks and liking them', function(done){
        chai.request(server)
        .get('/api/stock-prices?stock=GOOG&stock=MSFT&like=true')
        .end(function(err, res){
            assert.equal(err, null, 'should be no errors');
            assert.equal(res.status, 200);
            assert.typeOf(res, 'object', 'response must be object');
            assert.isArray(res.body.stockData,  'must be an array');
            assert.equal(res.body.stockData[0].stock, 'GOOG', 'stock must be correct symbol');
            assert.isNumber(res.body.stockData[0].price, 'price must be a number');
            assert.isNumber(res.body.stockData[0].rel_likes, 'likes must be a number');
            done();
        });
    });

});
