const { ClientError } = require("./errors");

//async wrapper function for error handling
function asyncWrap(func) {
    return function(req, res, next) {
        func(req, res, next).catch(error => {
            //if client error, parse through
            if (error instanceof ClientError) {
                next(error);
            }
            //if cast error, actually invalid id, create client error and pass through to error handling
            else if (error.name === "CastError") {
                let e = new ClientError(404, "Cannot find resource - invalid url", "N/A", "N/A");
                e.stack = error.stack;
                next(e);
            }
        });
    }
}

module.exports = asyncWrap;