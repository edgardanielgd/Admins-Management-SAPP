function LogErrors( err, req, res, next) {
    console.log( err );
    next( err ); 
}

function BoomErrors( err, req, res, next){
    if( err.isBoom ){
        const output = err.output;

        res.status( output.statusCode ).json(
            output.payload
        );
    }
    next( err );
}

module.exports = { LogErrors, BoomErrors }