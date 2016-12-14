'use strict';
var moment = require('moment');
var jwt = require('jwt-simple');

exports.createJWT = function(user){
    var payload = {
        user: user,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
    };
    return jwt.encode(payload, process.env.TOKEN_SECRET);
}

exports.getJWTUser = function(token) {
  var payload = null;
  try {
    payload = jwt.decode(req.headers.authorization.replace('Bearer ', ''), process.env.TOKEN_SECRET);
  } catch (err) {}
  return payload ? payload.user : null;
}

exports.getJWTUserFromRequest = function(req) {
  if(!req.headers.authorization){
    return null;
  }
  return exports.getJWTUser(req.headers.authorization.replace('Bearer ', ''));
}

exports.handleError = function (res, err) {
    return res.send(400, err);
}

exports.ensureAuthenticated = function(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
  }
  var token = req.headers.authorization.split(' ')[1];

  var payload = null;
  try {
    payload = jwt.decode(token, process.env.TOKEN_SECRET);
  }
  catch (err) {
    return res.status(401).send({ message: err.message });
  }

  if (payload.exp <= moment().unix()) {
    return res.status(401).send({ message: 'Token has expired' });
  }
  req.user = payload.user;
  next();
}
