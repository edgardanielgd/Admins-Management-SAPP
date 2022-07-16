const boom = require("@hapi/boom");
const dbClient = require("./../db");
const bcrypt = require("bcrypt");

class AdminsService {
    constructor () {}

    async login( server, admName, admPassword ){
        
        const admins = server.admins;

        if( !admins ){
            // We dont want let them know there are not admins...
            throw boom.unauthorized( "Invalid admin / password data ");
        }
        // Admins are identified by name
        const admin = admins[ admName ];
        
        if( !admin ){
            // We dont want let them know there are not admins...
            throw boom.unauthorized( "Invalid admin / password data ");
        }

        const { admLevel } = admin;

        const comparation = await bcrypt.compare( admPassword, admin.admPassword);

        if( !comparation ){
            throw boom.unauthorized( "Invalid admin / password data ");
        }

        return {
            admLevel
        }
    }

    async create( server, admName, admPassword, admLevel ){

        if( server[ admName] ){
            throw boom.conflict(" There is already an admin with that name");
        }

        const { db } = dbClient;

        const serversCollection = db.collection( "Servers" );

        const password = await bcrypt.hash( admPassword, 10);

        const admin_key = "admins." + admName;
        const admin_record_data = {};
        admin_record_data [ admin_key ] = {
            admPassword: password,
            admLevel
        };

        const result = await serversCollection.updateOne(
            { _id: server._id },
            {
                $set: admin_record_data
            }
        )

        return result;
        
    }
}

module.exports = AdminsService;