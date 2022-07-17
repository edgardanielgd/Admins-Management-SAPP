const { Router } = require("express");

const AdminsService = require("./../services/admins.service");
const service = new AdminsService();

const AdminsRouter = new Router();
const router = new Router();
const { validateSchema } = require("./../middlewares/validation.handler");
const { adminInsertSchema, adminUpdateSchema } = require("./../schemas/admin.schema");

router.get( "/login/:name/:password",
    async ( req, res, next ) => {
        try{
            const { name, password } = req.params;
            const result = await service.login( req.server, name, password);
            res.status(200).json({
                ...result,
                statusMessage : "success"
            });
        }catch( e ){
            next( e );
        }
    }
);

router.get( "/add/:name/:password/:level",
    validateSchema( adminInsertSchema, "params" ),
    async ( req, res, next ) => {
        try{
            const { name, password, level} = req.params;

            const result = await service.create( req.server, name, password, level);
            res.status(200).json({
                statusMessage : "success"
            });
        }catch( e ){
            next( e );
        }
    }

);

router.get( "/delete/:name/",

);

router.get( "/update/:name/:newName/:newPassoword/:newLevel",
    validateSchema( adminUpdateSchema, "params" ),
    async ( req, res, next ) => {
        try{
            const { name, newName, newPassoword, newLevel} = req.params;
            
            res.status(200).json({
                statusMessage : "success"
            });
        }catch( e ){
            next( e );
        }
    }
);

router.get( "/query",
    async (req, res, next ) => {
        try{
            const admins_data = req.server_data.admins;

            const result = admins_data.map( (itAdmin) => {
                itAdmin.admName,
                itAdmin.admLevel
            });

            res.status(200).json({
                data: result
            });
        }catch( e ){
            next( e );
        }
    }
);

AdminsRouter.use("/admins", router );

module.exports = AdminsRouter;