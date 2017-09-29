var express = require('express');
var app = express();
var request = require('request');
var cheerio = require('cheerio');

app.get('/', function(req, res) {
 
  request('http://www.jd.com', function(error, response, body) {
    if (!error && response.statusCode == 200) {
      $ = cheerio.load(body);
      res.json({
          cat: $('#portal_7').length
      });
    }
  })
});

var server = app.listen(3000, function() {
  console.log('listening at 3000');
});
