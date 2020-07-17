const express = require('express');
const authUtils = require('./authUtils');
const fetch = require('node-fetch');
const jwt = require('jwt-simple');
const mongoose = require('mongoose');

const User = mongoose.model('User', mongoose.Schema({
  google: String,
  displayName: String,
  email: String
}));

// Configure router

const router = express.Router();

// Authenticate a google userId

router.post('/', async (req, res) => {
  const accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
  const peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
  const params = {
    code: req.body.code,
    client_id: req.body.clientId,
    client_secret: process.env.GOOGLE_OAUTH_SECRET,
    redirect_uri: req.body.redirectUri,
    grant_type: 'authorization_code'
  };
  const tokenResponse = await fetch(accessTokenUrl, { method: 'POST', body: JSON.stringify(params) });
  const token = await tokenResponse.json();
  const accessToken = token.access_token;
  const headers = { Authorization: 'Bearer ' + accessToken };

  const profileResponse = await fetch(peopleApiUrl, { headers });
  const profile = await profileResponse.json();

  User.findOne({ google: profile.sub }, (err, existingUser) => {
    if (existingUser) {
      return res.send({ token: authUtils.createJWT(existingUser) });
    }
    const user = new User({
      google: profile.sub,
      displayName: profile.given_name
    });
    user.save(function(err) {
      const token = authUtils.createJWT(user);
      res.send({ token: token });
    });
  });
});

// Get the current user

router.get('/', (req, res) => {
  const user = authUtils.getJWTUserFromRequest(req);

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
