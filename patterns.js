var express = require('express');
var paginate = require('express-paginate');
var ObjectId = require('mongodb').ObjectID;
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var authUtils = require('./authUtils');
var generateImage = require('./generateImage');

var PatternSchema = mongoose.Schema({
  _id: Number,
  name: String,
  description: String,
  width: Number,
  height: Number,
  imageUrl: String,
  pattern: Array,
  user: {type: Number, ref: 'User'}
});
PatternSchema.plugin(mongoosePaginate);
var Pattern = mongoose.model('Pattern', PatternSchema);

// Configure router

var router = express.Router();

// Get a list of patterns

// GET /patterns

router.use(paginate.middleware(10, 50));

router.get('/', function(req, res) {
  Pattern.paginate({}, {page: req.query.page, limit: req.query.limit}, function(err, result) {
    res.json({
      patterns: result.docs,
      totalPages: result.pages,
      totalPatterns: result.total
    });
  });
});

// Get a single pattern

// GET /pattern/:id

router.get('/:id', function(req, res) {
  Pattern.findOne({_id: ObjectId(req.params.id)}, function(err, pattern) {
    if(err){
      return res.status(404).json({message: 'Pattern not found.'});
    }
    if(!pattern.imageUrl){
      generateImage(req.body.width, req.body.height, req.body.align, req.body.pattern, function(url) {
        pattern.imageUrl = url;

        pattern.save(function(err) {
          if(err){
            req.status(500).json({error: err.message});
          }else{
            res.json(pattern);
          }
        })
      });
    }else{
      res.json(pattern);
    }
  });
});

// TODO: Remove this unauthenticated endpoint

router.post('/import', function(req, res) {
  var pattern = new Pattern(req.body);

  // TODO: Validation

  generateImage(req.body.width, req.body.height, req.body.align, req.body.pattern, function(url) {
    pattern.imageUrl = url;

    pattern.save(function(err) {
      if(err){
        req.status(500).json({error: err.message});
      }else{
        res.json({});
      }
    })
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
//   align: 'horizontal',
// }

router.post('/', function(req, res) {
  var pattern = new Pattern(req.body);
  pattern.user = req.user._id;

  // TODO: Validation

  generateImage(req.body.width, req.body.height, req.body.align, req.body.pattern, function(url) {
    pattern.imageUrl = url;

    pattern.save(function(err) {
      if(err){
        req.status(500).json({error: err.message});
      }else{
        res.json({});
      }
    })
  });
});

module.exports = router;
