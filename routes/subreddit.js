const express = require("express");
const mongoose = require("../required/mongoose");
const { asyncWrap } = require("../required/helperFunctions")
const { ClientError } = require("../required/errors");
const { Post, Subreddit, User } = require("../required/schemas");
const postRouter = require("./post");

const router = express.Router({mergeParams: true});

//home index route - working for asyncWrap
router.get("/", asyncWrap(async (req, res, next) => {
    const { subreddit } = req.params;
    let page = await Subreddit.findOne({name: subreddit})
    //creates new subreddit if no subreddit found - CHANGE TO CANNOT FIND SUBREDDIT - MAKE NEW FORM ON REDDIT HOMEPAGE FOR MAKING SUBREDDIT
    if (page === null) {
        throw new ClientError(404, `Cannot find Subreddit ${subreddit} - maybe you should make it!`, "subreddit", "get");
    }
    
    //gets posts and builds list of posts to view
    let posts = await Post.find({_id: page.posts}).sort({datePosted: -1});

    //gets subList for user
    let subscribed = false;
    if (req.session.user !== null && req.session.user !== undefined) {
        const user = await User.findOne({username: req.session.user});
        if (user === null) {
            throw new ClientError(404, `Unable fo find user ${user}`, "user", "get");
        }
        subscribed = user.subscriptions.includes(page._id);
    }

    res.render("redditPage", { "page": page, 
    "posts": posts, 
    "subreddit": subreddit, 
    "user": req.session.user,
    "subscribed": subscribed,
    "originalUrl": req.originalUrl });  
}));


//new post post route - full reddit post - updated for db - working
router.post("/", asyncWrap(async (req, res, next) => {
    const { subreddit } = req.params;
    let body = req.body;
    let newPost = new Post ({
        title: body.title,
        author: body.username,
        text: body.text,
        img: body.imgSrc,
        comments: [],
        datePosted: new Date(),
        lastModified: new Date()
    });
    //saves post
    let finished = await newPost.save();
    if (finished != newPost) {
        throw new ClientError(404, `Unabled to complete post ${newPost._id} - server side error`, "post", "post");
    }

    //updates subreddit
    finished = await Subreddit.updateOne({name: subreddit}, {$addToSet: {posts: newPost._id}});
    if (finished.modifiedCount != 1) {
        throw new ClientError(404, `Unable to update subreddit ${subreddit} with post id ${newPost._id} - server side error`, "subreddit", "patch");
    }

    res.redirect(`${subreddit}`);
}));

//handles subscription management - based on query string
router.post("/sub", asyncWrap(async (req, res, next) => {
    let sub = true;
    if (req.query.q === "unsub") {
        sub = false;
    }
    const username = req.session.user;
    //gets user from db
    const user = await User.findOne({username: username});
    if (user === null) {
        throw new ClientError(404, `Unable fo find user ${user}`, "user", "get");
    }
    //gets subreddit
    const subreddit = await Subreddit.findOne({name: req.params.subreddit});
    if (subreddit === null) {
        throw new ClientError(404, `Unable fo find subreddit ${req.params.subreddit}`, "subreddit", "get");
    }

    //adds id to user only if not already subscribed
    if (sub && !user.subscriptions.includes(subreddit._id)) {
        user.subscriptions.push(subreddit._id);
    }

    //unsubs only if already subbed
    if (!sub && user.subscriptions.includes(subreddit._id)) {
        user.subscriptions.splice(user.subscriptions.indexOf(subreddit._id), 1);
    }

    //updates user with subscription
    const finished = await user.save();
    if (finished != user) {
        throw new ClientError(404, `Unabled to subscribed to ${req.params.subreddit} - server side error`, "user", "post");
    }

    res.redirect(`/r/${req.params.subreddit}`);
}));

//handles posts
router.use("/:id", postRouter);

module.exports = router;