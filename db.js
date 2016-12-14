var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.

var db;

var getDb = function(cb) {
  if(!db){
    mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
      if (err) {
        console.log(err);
        process.exit(1);
      }

      // Save database object from the callback for reuse.

      db = database;
      console.log('Database connection ready');

      if(cb){
        cb(db);
      }
      return db;
    });
  }else{
    if(cb){
      cb(db);
    }
    return db;
  }
}

module.exports = getDb;
