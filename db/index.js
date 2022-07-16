const mongodb = require("mongodb").MongoClient;

const { DBNAME, DBUSER, DBPASSWORD, DBDOMAIN } = require("./../config");

const dbName = encodeURIComponent( DBNAME );
const dbPassword = encodeURIComponent( DBPASSWORD );
const dbUser = encodeURIComponent( DBUSER );
const dbDomain = encodeURIComponent( DBDOMAIN );

const dbUrl = "mongodb+srv://"+
    dbUser + ":" + dbPassword + "@" + dbDomain + "/"
    dbName + "?retryWrites=true&w=majority";

module.exports = db = {};

mongodb.connect(
    dbUrl,
    { useNewUrlParser : true, useUnifiedTopology: true },
    (err,client) =>{
        if (err) throw err;
        db.db = client.db( DBNAME );
        
   });
