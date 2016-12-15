var express = require('express');
var paginate = require('express-paginate');
var cloudinary = require('cloudinary');
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var authUtils = require('./authUtils');

var PatternSchema = mongoose.Schema({
  name: String,
  description: String,
  width: Number,
  height: Number,
  imageUrl: String,
  pattern: Array,
  user: mongoose.Schema.Types.Mixed
};
PatternSchema.plugin(mongoosePaginate);
var Pattern = mongoose.model('Pattern', PatternSchema));

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

router.use(paginate.middleware(10, 50));

router.get('/', function(req, res) {
  Pattern.paginate({}, {page: req.query.page, limit: req.query.limit}, function(err, patterns, pageCount, itemCount) {
    res.json({
      patterns: patterns,
      pageCount: pageCount,
      itemCount: itemCount
    });
  });
});

// Get a single pattern

// GET /pattern/:id

router.get('/:id', function(req, res) {
  Pattern.findOne({_id: new mongo.ObjectId(req.params.id)}, function(err, pattern) {
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
  var pattern = new Pattern(req.body);
  pattern.user = req.user;

  // TODO: Validation

  cloudinary.uploader.upload(req.body.image, function(result) {
    pattern.imageUrl = result.secure_url;

    pattern.save(function(err) {
      if(err){
        req.status(500).json({error: err.message});
      }else{
        res.json({});
      }
    })
  }, {});
});

module.exports = router;
