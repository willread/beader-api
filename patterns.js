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
  align: {
    type: String,
    enum: ['normal',' pixel', 'horizontal', 'vertical'],
    default: 'normal',
  },
  width: Number,
  height: Number,
  imageUrl: String,
  pattern: Array,
  createdDate: {type: Date, default: Date.now},
  updatedDate: {type: Date, default: Date.now},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});
PatternSchema.index({name: 'text', description: 'text'})
PatternSchema.plugin(mongoosePaginate);
var Pattern = mongoose.model('Pattern', PatternSchema);

// Configure router

var router = express.Router();

// Get a list of patterns

// GET /patterns

router.use(paginate.middleware(10, 50));

router.get('/', function(req, res) {
  const query = {};
  if (req.query.search) {
    query.$text = {$search: req.query.search};
  }
  Pattern.paginate(query, {page: req.query.page, limit: req.query.limit, populate: {path: 'user', select: '_id displayName'}, sort: {_id: 'desc'}}, function(err, result) {
    if(err) {
      return res.status(404).json({message: 'Patterns error.', error: err.message});
    }

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
  Pattern.paginate({user: req.params.id}, {page: req.query.page, limit: req.query.limit, populate: {path: 'user', select: '_id displayName'}, sort: {_id: 'desc'}}, function(err, result){
    if(err) {
      return res.status(404).json({message: 'User patterns error.', error: err.message});
    }

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
    .populate('user', '_id displayName')
    .exec(function(err, pattern) {
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

  var pattern = new Pattern(req.body);
  pattern.user = req.user._id;

  generateImage(req.body.width, req.body.height, req.body.align, req.body.pattern, function(url) {
    pattern.imageUrl = url;

    pattern.save(function(err, pattern) {
      if(err){
        res.status(500).json({error: err.message});
      }else{
        res.json(pattern);
      }
    })
  });
});

// Delete a pattern

// DELETE /patterns/:id

router.delete('/:id', function(req, res) {
  Pattern.findOne({_id: req.params.id})
    .populate('user', '_id displayName')
    .exec(function(err, pattern) {
      if(err){
        return res.status(404).json({message: 'Pattern not found.', error: err.message});
      }

      if(pattern.user.id !== req.user._id){
        return res.status(403).json({message: 'You are not allowed to delete this pattern'});
      }

      Pattern.remove(pattern, function(err) {
        res.json();
      });
    });
});

// Update apattern

// PUT /patterns/:id

router.put('/:id', function(req, res) {
  Pattern.findOne({_id: req.params.id})
    .populate('user', '_id displayName')
    .exec(function(err, pattern) {
      if(err){
        return res.status(404).json({message: 'Pattern not found.', error: err.message});
      }

      if(pattern.user.id !== req.user._id){
        return res.status(403).json({message: 'You are not allowed to update this pattern'});
      }

      req.sanitize('name').escape();
      req.sanitize('description').escape();

      const updatedPattern = {...req.body};
      delete updatedPattern._id;

      updatedPattern.width = parseInt(updatedPattern.width);
      updatedPattern.height = parseInt(updatedPattern.height);

      updatedPattern.pattern = updatedPattern.pattern.map(function(cell) {
        return cell.replace(/[^A-Za-z0-9]/g, '');
      });

      generateImage(updatedPattern.width, updatedPattern.height, updatedPattern.align, updatedPattern.pattern, function(url) {
        pattern.imageUrl = url;
        pattern.name = updatedPattern.name;
        pattern.description = updatedPattern.description;
        pattern.align = updatedPattern.align;
        pattern.width = updatedPattern.width;
        pattern.height = updatedPattern.height;
        pattern.pattern = updatedPattern.pattern;

        pattern.save(function(err, finalPattern) {
          if(err){
            res.status(500).json({error: err.message});
          }else{
            res.json(finalPattern);
          }
        });
      });
    });
});

module.exports = router;
