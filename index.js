const express = require("express");
const bodyParser = require("body-parser");
const { PORT } = require("./config");
const router = require("./routes");
const { LogErrors, BoomErrors } = require("./middlewares/error.handler");
const App = express();

App.use( router );
App.use( LogErrors );
App.use( BoomErrors );

App.listen(PORT, () => {
    console.log( "Listening on port: " + PORT);
})