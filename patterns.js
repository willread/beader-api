var express = require('express');
var cloudinary = require('cloudinary');
var authUtils = require('./authUtils');
var mongo = require('mongodb');
var db = require('./db').getDb;

// Configure router

var router = express.Router();

// Configure image upload SDK

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get a list of patterns

// GET /patterns

router.get('/', function(req, res) {
  db().collection('patterns').find().sort({_id, -1).limit(5).skip(0).toArray(function(err, patterns) {
      res.json(patterns);
  });
});

// Get a single pattern

// GET /pattern/:id

router.get('/:id', function(req, res) {
  db().collection('patterns').findOne({_id: new mongo.ObjectId(req.params.id)}, function(err, pattern) {
    if(err){
      return res.status(404).json({message: 'Pattern not found.'});
    }
    console.log('pattern:', pattern, 'id:', req.params.id);
    res.json(pattern);
  });
});

// Routes after this are authenticated

router.use(authUtils.ensureAuthenticated);

// Create a new pattern

// POST /patterns {
//   name: '',
//   description: '',
//   width: 10,
//   height: 10,
//   pattern: ['#ffffff', ...],
//   image: 'data:image/png;base64,...'
// }

router.post('/', function(req, res) {
  var pattern = req.body;
  pattern.user = req.user;

  // TODO: Validation

  cloudinary.uploader.upload(pattern.image, function(result) {
    pattern.imageUrl = result.secure_url;
    pattern.image = null;

    db().collection('patterns').insertOne(pattern, function(err, doc) {
      if(err){
        req.status(500).json({error: err.message});
      }else{
        res.json(doc);
      }
    })
  }, {});
});

module.exports = router;
