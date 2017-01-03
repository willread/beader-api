var express = require('express');
var authUtils = require('./authUtils');
var request = require('request');
var jwt = require('jwt-simple');
var mongoose = require('mongoose');

var User = mongoose.model('User', mongoose.Schema({
  google: String,
  displayName: String,
  email: String
}));

// Configure router

var router = express.Router();

// Authenticate a google userId

router.post('/', function(req, res) {
  var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
  var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
  var params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: process.env.GOOGLE_OAUTH_SECRET,
    redirect_uri: req.body.redirectUri,
    grant_type: 'authorization_code'
  };

  request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
    var accessToken = token.access_token;
    var headers = { Authorization: 'Bearer ' + accessToken };

    request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
      User.findOne({ google: profile.sub }, function(err, existingUser) {
        if (existingUser) {
          return res.send({ token: authUtils.createJWT(existingUser) });
        }
        var user = new User({
          google: profile.sub,
          displayName: profile.given_name
        });
        user.save(function(err) {
          var token = authUtils.createJWT(user);
          res.send({ token: token });
        });
      });
    });
  });
});

// Get the current user

router.get('/', function(req, res) {
  let user = authUtils.getJWTUserFromRequest(req);

  if(!user){
    return res.status(403).send({message: 'You are not logged in'});
  }

  User.findOne({google: user.google}, function(err, user) {
    if(err || !user){
      return res.status(404).send({message: 'User not found'});
    }
    res.send(user);
  });
});

module.exports = router;
