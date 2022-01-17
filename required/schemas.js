const mongoose = require('mongoose');

//initializes schema for subreddits and posts
const subRedditSchema = new mongoose.Schema({
    name: String, 
    subscribers: Number,
    description: String,
    posts: [mongoose.ObjectId]
});

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

const Subreddit = mongoose.model('subreddit', subRedditSchema);

const Post = mongoose.model('post', postSchema);

module.exports = {
    "Subreddit": Subreddit,
    "Post": Post
};