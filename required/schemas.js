const bcrypt = require("bcrypt");
const mongoose = require('mongoose');
const { ClientError } = require("../required/errors");

//initializes schema for subreddits and posts
//Subreddit Schema
const subRedditSchema = new mongoose.Schema({
    name: String, 
    subscribers: Number,
    description: String,
    posts: [mongoose.ObjectId]
});

//Post Schema
const postSchema = new mongoose.Schema({ 
    title: String,
    author: String,
    text: String,
    img: String,
    comments: [{
        _id: mongoose.ObjectId,
        text: String,
        author: String,
        datePosted: Date,
        lastModified: Date
    }],
    datePosted: Date,
    lastModified: Date 
});

//helper function for finding comment of given post - used by protect helper function
postSchema.statics.getComment = async function([postId, commentIndex]) {
    const post = await this.findById(postId);
    //checks post exists
    if (post === null) {
        throw new ClientError(404, `Cannot find post ${postId} - invalid url`, "post", "get");
    }
    //checks comment exists
    if (commentIndex >= post.comments.length) {
        throw new ClientError(404, `Cannont find comment ${commentIndex} - no such comment`, "comment", "get");
    }

    //package post in return to reduce lookups
    return {
        author: post.comments[commentIndex].author, 
        post: post
    };

}


//User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

//need to handle bcyrpt errors
userSchema.pre("save", async function(next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});




//turns Schemas into Models
const Subreddit = mongoose.model('subreddit', subRedditSchema);

const Post = mongoose.model('post', postSchema);

const User = mongoose.model('user', userSchema);

module.exports = {
    "Subreddit": Subreddit,
    "Post": Post,
    "User": User
};