var express = require('express');
var cloudinary = require('cloudinary');
var authUtils = require('./authUtils');
var db = require('./db').db;

// Configure router

var router = express.Router();
router.use(authUtils.ensureAuthenticated);

// Configure image upload SDK

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create a new pattern

// {
//   name: '',
//   description: '',
//   width: 10,
//   height: 10,
//   pattern: ['#ffffff', ...],
//   image: 'data:image/png;base64,...'
// }

router.post('/', function(req, res) {
  var pattern = req.body;

  // TODO: Validation

  cloudinary.uploader.upload(pattern.image, function(result) {
    pattern.imageUrl = result.secure_url;

    db.collection('patterns').insertOne(pattern, function(err, doc) {
      if(err){
        req.status(500).json({error: err.message});
      }else{
        res.json(doc);
      }
    })
  }, {});
});

module.exports = router;
