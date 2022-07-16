const { Router } = require("express");
const boom = require("@hapi/boom");

const ServersService = require("./../services/servers.service");
const adminsRouter = require("./admins.router");
const service = new ServersService();

const serversRouter = new Router();
const router = new Router();

router.use(
    "/query/:serverName/:serverPassword",
    async ( req, res, next ) => {
        try{
            const { serverName, serverPassword } = req.params;

            if( !serverName || !serverPassword )
                throw boom.badRequest( "Invalid data" );

            const server = await service.login( serverName, serverPassword );
            req.server = server;
            next();
        }catch( e ){
            next( e );
        }
    },
    adminsRouter
);

router.get(
    "/create/:serverName/:serverPassword",
    async( req, res, next ) => {
        try{
            const { serverName, serverPassword } = req.params;

            if( !serverName || !serverPassword )
                throw boom.badRequest( "Invalid data" );
            
            const result = await service.create( serverName, serverPassword );
            res.status(200).json({
                ...result,
                statusMessage : "success"
            });
        }catch( e ){
            next( e );
        }
    }
)

serversRouter.use("/servers", router);

module.exports = serversRouter;