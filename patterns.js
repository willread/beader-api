var express = require('express');
var paginate = require('express-paginate');
var ObjectId = require('mongodb').ObjectID;
var mongoose = require('mongoose').set('debug', true);
var mongoosePaginate = require('mongoose-paginate');

var authUtils = require('./authUtils');
var generateImage = require('./generateImage');

var PatternSchema = mongoose.Schema({
  name: String,
  description: String,
  width: Number,
  height: Number,
  imageUrl: String,
  pattern: Array,
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});
PatternSchema.plugin(mongoosePaginate);
var Pattern = mongoose.model('Pattern', PatternSchema);

// Configure router

var router = express.Router();

// Get a list of patterns

// GET /patterns

router.use(paginate.middleware(10, 50));

router.get('/', function(req, res) {
  Pattern.paginate({}, {page: req.query.page, limit: req.query.limit, populate: 'user'}, function(err, result) {
    res.json({
      patterns: result.docs,
      totalPages: result.pages,
      totalPatterns: result.total
    });
  });
});

// Get all patterns by a user

router.use(paginate.middleware(10, 50));

router.get('/user/:id', function(req, res) {
  Pattern.paginate({user: req.params.id}, {page: req.query.page, limit: req.query.limit, populate: 'user'}, function(err, result){
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
  Pattern.findOne({_id: req.params.id})
    .populate('user')
    .exec(function(err, pattern) {
      console.log("Err", err, "Pattern", pattern);
      if(err){
        return res.status(404).json({message: 'Pattern not found.', error: err.message});
      }
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
//   align: 'horizontal',
// }

router.post('/', function(req, res) {
  req.sanitize('name').escape();
  req.sanitize('description').escape();

  req.body.width = parseInt(req.body.width);
  req.body.height = parseInt(req.body.height);

  req.body.pattern = req.body.pattern.map(function(cell) {
    return cell.replace(/[^A-Za-z0-9]/g, '');
  });

  req.body.align = req.body.align.replace(/[^a-z], ''/g, '');

  var pattern = new Pattern(req.body);
  pattern.user = req.user._id;

  generateImage(req.body.width, req.body.height, req.body.align, req.body.pattern, function(url) {
    pattern.imageUrl = url;

    pattern.save(function(err) {
      if(err){
        res.status(500).json({error: err.message});
      }else{
        res.json({});
      }
    })
  });
});

module.exports = router;
