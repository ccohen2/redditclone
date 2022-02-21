const express = require("express");
const mongoose = require("../required/mongoose");
const { asyncWrap } = require("../required/helperFunctions")
const { ClientError } = require("../required/errors");
const { Post, Subreddit } = require("../required/schemas");
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
    res.render("redditPage", { "page": page, "posts": posts, "subreddit": subreddit });  
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

//handles posts
router.use("/:id", postRouter);

module.exports = router;