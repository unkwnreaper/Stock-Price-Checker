'use strict';

const bcrypt      = require('bcrypt');
const saltRounds = 12;
const mongoose = require('mongoose');


// mongoose setup
mongoose.connect(process.env.MONGO_URI);
const Schema = mongoose.Schema;
// Schema setup
const stockSchema = new Schema({
  stock: {type: String, required: true},
  ipHashes: [{  type: String  }]
});
// Model setup
const stockModel = mongoose.model('stockModel', stockSchema);

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      var {stock, like} = req.query;
      var query, data, userHash;
      var response = [];

      // ip of client
      var ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
      userHash = bcrypt.hashSync(ip, saltRounds);

      if (like == 'true') {
        if (Array.isArray(stock)) {
          for (var i = 0; i < stock.length; i++) {
            query = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock[i].toLowerCase()}/quote`);
            data = await query.json();
            var stockData = await stockModel.findOne({stock: data.symbol});
            if (!stockData) {
              stockData = new stockModel({stock: data.symbol, ipHashes: [ userHash ]});
              await stockData.save();
            }
            else {
              var newLike = true;
              for (var j = 0; j < stockData.ipHashes.length & newLike; j++) {
                if (bcrypt.compareSync(ip, stockData.ipHashes[j])) newLike = false;
              }
              if (newLike) {
                stockData = await stockModel.findOneAndUpdate({stock: data.symbol}, { $addToSet: { ipHashes: userHash } });
                await stockData.save();
              }
            }
          }
        }
        else {
          query = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock.toLowerCase()}/quote`);
          data = await query.json();
          var stockData = await stockModel.findOne({stock: data.symbol});
          if (!stockData) {
            stockData = new stockModel({stock: data.symbol, ipHashes: [ userHash ]});
            await stockData.save();
          }
          else {
            var newLike = true;
            for (var i = 0; i < stockData.ipHashes.length & newLike; i++) {
              if (bcrypt.compareSync(ip, stockData.ipHashes[i])) newLike = false;
            }
            if (newLike) {
              stockData = await stockModel.findOneAndUpdate({stock: data.symbol}, { $addToSet: { ipHashes: userHash } });
              await stockData.save();
            }
          }
        }
      }

      if (Array.isArray(stock)) {
        var likes = [];

        for (var i = 0; i < stock.length; i++) {
          
          try {
            query = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock[i].toLowerCase()}/quote`);
            data = await query.json();
            var stockData = await stockModel.findOne({stock: data.symbol});
            if (stockData) {
              likes[i] = stockData.ipHashes.length;
            }
            response.push({"stock": data.symbol, "price": data.latestPrice, "rel_likes": 0});
          }
          catch (err) {
            res.json({ error: err.message });
            console.log(err);
          }
        }
        if (likes.length >= 2) {
          response[0].rel_likes = likes[0] - likes[1];
          response[1].rel_likes = likes[1] - likes[0];
        }
        res.json({"stockData": response});
      }
      else {
        likes = 0;
        try {
          query = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock.toLowerCase()}/quote`);
          data = await query.json();
          var stockData = await stockModel.findOne({stock: data.symbol});
          if (stockData) {
            likes = stockData.ipHashes.length;
          }
          response.push({"stock": data.symbol, "price": data.latestPrice, "likes": likes});
        }
        catch (err) {
          res.json({ error: err.message });
          console.log(err);
        }
        res.json({"stockData": response[0]});
      }
      console.log(response);
    });
    
};
