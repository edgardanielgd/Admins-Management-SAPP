const { Router } = require("express");
const serversRouter = require("./servers.router");

const ApiRouter = new Router();

ApiRouter.use("/api", serversRouter);

module.exports = ApiRouter;
