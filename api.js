var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var mongoSanitize = require('mongo-sanitize');
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

var app = express();

// Set up bodyParser and set a sane upper size limit

app.use(bodyParser.json({limit: '5mb'}));

// Allow validating input

app.use(expressValidator());

// Allow cross-origin

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:9000'); // FIXME
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Protect against mongo query attacks

app.use(function(req, res, next) {
  req.body = mongoSanitize(req.body);
  next();
});

// Initialize the app.

var db = mongoose.connection;
db.on('error', function() {
  process.exit(1);
});

db.once('open', function() {
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log('App now running on port', port);
  });
});

// Import modules

app.use('/auth', require('./auth'));
app.use('/patterns', require('./patterns'));
