var cloudinary = require('cloudinary');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

var app = express();
// app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json({limit: '5mb'}));

app.all('*', function(req, res, next) {
   res.header('Access-Control-Allow-Origin', 'http://localhost:9000');
   res.header('Access-Control-Allow-Headers', 'X-Requested-With');
   res.header('Access-Control-Allow-Headers', 'Content-Type');
   res.header('Access-Control-Allow-Credentials', 'true');
   next();
});

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log('Database connection ready');

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log('App now running on port', port);
  });
});

// Create a new pattern

// {
//   name: '',
//   description: '',
//   userId: 1,
//   width: 10,
//   height: 10,
//   pattern: ['#ffffff', ...],
//   image: 'data:image/png;base64,...'
// }

app.post('/patterns', function(req, res) {
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

// Authenticate a google userId

app.post('/auth', function(req, res) {
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

    // Step 2. Retrieve profile information about the current user.
    request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {

      // Step 3a. Link user accounts.
      if (req.headers.authorization) {
        User.findOne({ google: profile.sub }, function(err, existingUser) {
          if (existingUser) {
            return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
          }
          var token = req.headers.authorization.split(' ')[1];
          var payload = jwt.decode(token, config.TOKEN_SECRET);
          User.findById(payload.sub, function(err, user) {
            if (!user) {
              return res.status(400).send({ message: 'User not found' });
            }
            user.google = profile.sub;
            user.picture = user.picture || profile.picture.replace('sz=50', 'sz=200');
            user.displayName = user.displayName || profile.name;
            user.save(function() {
              var token = authUtils.createJWT(user);
              console.log("token sent");
              res.send({ token: token });
            });
          });
        });
      } else {
        // Step 3b. Create a new user account or return an existing one.
        User.findOne({ google: profile.sub }, function(err, existingUser) {
          if (existingUser) {
              console.log("token sent");

            return res.send({ token: authUtils.createJWT(existingUser) });
          }
          var user = new User();
          user.google = profile.sub;
          user.picture = profile.picture.replace('sz=50', 'sz=200');
          user.displayName = profile.name;
          user.save(function(err) {
            var token = authUtils.createJWT(user);
              console.log("token sent");

            res.send({ token: token });
          });
        });
      }
    });
  });
});
