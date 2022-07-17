require("dotenv").config();

const config = {
    PORT : process.env.PORT || 3000,
    DBNAME : process.env.dbName,
    DBUSER : process.env.dbUser,
    DBPASSWORD : process.env.dbPassword,
    DBDOMAIN : process.env.dbDomain,
    JWTKEY : process.env.jwtKey
}

module.exports = config;
