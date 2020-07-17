'use strict';
const moment = require('moment');
const jwt = require('jwt-simple');

exports.createJWT = user => {
  const payload = {
        user: user,
        iat: moment().unix(),
        exp: moment().add(365 * 10, 'days').unix()
    };
    return jwt.encode(payload, process.env.TOKEN_SECRET);
}

exports.getJWTUser = token => {
  let payload = null;
  try {
    payload = jwt.decode(token, process.env.TOKEN_SECRET);
  } catch (err) {}
  return payload ? payload.user : null;
}

exports.getJWTUserFromRequest = req => {
  if(!req.headers.authorization){
    return null;
  }
  return exports.getJWTUser(req.headers.authorization.replace('Bearer ', ''));
}

exports.handleError = (res, err) => {
    return res.send(400, err);
}

exports.ensureAuthenticated =(req, res, next) => {
  if(req.method != 'OPTIONS'){
    if (!req.headers.authorization) {
      return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
    }
    const token = req.headers.authorization.split(' ')[1];

    let payload = null;
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
  }

  next();
}
