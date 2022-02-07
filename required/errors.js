//error classes for various errors that may occur in document
//Not Found Error - posts, and subreddits
class ClientError extends Error {
    constructor (statusCode, statusMessage, level, action) {
        super();

        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
        this.level = level; //subreddit or post or other (no /r/)
        this.action = action; //get, post, patch, delete
    }
}

//unable to update post

module.exports = {
    ClientError: ClientError
};