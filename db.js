var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.

exports.db = null;

exports.connect = function(cb) {
  mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
    if (err) {
      console.log(err);
      process.exit(1);
    }

    // Save database object from the callback for reuse.

    exports.db = database;
    console.log('Database connection ready');

    if(cb){
      cb();
    }
  });
};
