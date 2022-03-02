const { ClientError } = require("./errors");
const { Subreddit, Post } = require("./schemas");

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


//WORKING FOR POSTS AND COMMENTS - NOT TESTED FOR SUBREDDIT
//function to protect routes - takes in which schema to use and which method is being protected as input
//method is used for error messages only - no difference in logic
//req, res, next same as in express route callbacks
function protect(schemaName, method) {
    //sets lookup function - options and error set in returned function since they are
    //dependent on req
    const schema = {
        subreddit: Subreddit,
        post: Post,
        comment: Post
    }[schemaName];

    const lookup = {
        subreddit: "findOne",
        post: "findById",
        comment: "getComment"
    }[schemaName];

    //return function
    return asyncWrap(async function(req, res, next) {
        //sets options and error message
        const options = {
            subreddit: {name: req.params.subreddit},
            post: req.params.id,
            comment: [req.params.id, req.params.commentIndex]
        }[schemaName];

        const { message, level } = {
            subreddit: {
                message: `subreddit ${req.params.subreddit}`,
                level: "subreddit",
            },
            post: {
                message: `post ${req.params.post}`,
                level: "post"
            },
            comment: {
                message: `comment ${req.params.commentIndex} of post ${req.params.post}`,
                level: "comment"
            }
        }[schemaName];

        //schema lookup
        const item = await schema[lookup](options);

        //error on lookup failure
        if (item === null) {
            throw new ClientError(404, `Unable to find ${message} - invalid url`, level, method);
        }

        //check credentials
        if (item.author != req.session.user) {
            throw new ClientError(403, `Unable to access - invalid credentials`, level, method);
        }

        //save post to locals so next callback has access to post - reduce lookup times
        res.locals.item = (schemaName === "comment") ? item.post : item;

        //return / next
        next();
    })
}


module.exports = {
    asyncWrap,
    protect
};