const boom = require("@hapi/boom");
const dbClient = require("./../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWTKEY } = require("./../config");

class AdminsService {
    constructor () {}

    async login( server, admName, admPassword ){
        
        const admins = server.admins;

        if( !admins ){
            // We dont want let them know there are not admins...
            throw boom.unauthorized( "Invalid admin / password data ");
        }
        // Admins are identified by name
        const admin = admins.filter( (itAdmin) => itAdmin.admName === admName )
        
        if( !admin ){
            // We dont want let them know there are not admins...
            throw boom.unauthorized( "Invalid admin / password data ");
        }

        const { admLevel } = admin;

        const comparation = await bcrypt.compare( admPassword, admin.admPassword);

        if( !comparation ){
            throw boom.unauthorized( "Invalid admin / password data ");
        }

        const data = {
            adminLevel : admLevel,
            date : new Date()
        };

        const token = jwt.sign( data, JWTKEY , {
            expiresIn: "1d"
        });

        return {
            admLevel,
            token
        }
    }

    async chekAuth ( token ){
        const validation = jwt.decode( token, JWTKEY );

        if( validation ){
             return validation;
        }

        throw boom.unauthorized( "Incorrect admin's token");
    }

    async create( server, admName, admPassword, admLevel ){

        if( server[ admName] ){
            throw boom.conflict(" There is already an admin with that name");
        }

        const { db } = dbClient;

        const serversCollection = db.collection( "Servers" );

        const password = await bcrypt.hash( admPassword, 10);
        
        const result = await serversCollection.updateOne(
            { _id: server._id },
            {
                $push: {
                    admins: {
                        admName,
                        password,
                        admLevel
                    }
                }
            }
        )
        
        return result;
        
    }
}

module.exports = AdminsService;