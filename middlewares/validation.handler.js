const Joi = require("joi");
const boom = require("@hapi/boom");

function validateSchema ( schema, field ){
    return ( req, res, next ) => {
        
        const validation = schema.validate( req[field] ,
            {
                abortEarlt: false
            } 
        );

        if( validation.error ){
            next(
                boom.badRequest( validation.error )
            );
        }else
            next();
    }
    
}

module.exports = { validateSchema }