const boom = require("@hapi/boom");
const dbClient = require("./../db");
const bcrypt = require("bcrypt");

class ServersService {
    constructor() {}

    async findByName ( svName ){
        const { db } = dbClient;

        const serversCollection = db.collection( "Servers" );
        
        const results = serversCollection.find({
            svName : {
                $eq: svName
            }
        })

        return results;
    }

    async login( svName, svPassword ){

        const results = await this.findByName( svName );
        const server  = await results.tryNext();

        if( ! server ){
            throw boom.notFound( "Could not find a server with that name" );
        }

        const validation = await bcrypt.compare( svPassword, server.svPassword );

        if( !validation ){
            throw boom.unauthorized( "Invalid server name / password data");
        }
        
        return server;
    }

    async create( svName, svPassword ){
        const results = await this.findByName( svName );

        const coincidence = await results.tryNext();

        if( coincidence ){ 
            throw boom.conflict( "A server with that name already exists" );
        }
        
        const password = await bcrypt.hash( svPassword, 10 );

        const { db } = dbClient;

        const serversCollection = db.collection( "Servers" );

        const result = await  serversCollection.insertOne( {
            svName : svName,
            svPassword : password
        } );

        return result;
    }
}

module.exports = ServersService;