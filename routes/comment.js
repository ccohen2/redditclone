const express = require("express");
const mongoose = require("../required/mongoose");
const asyncWrap = require("../required/helperFunctions")
const { ClientError } = require("../required/errors");
const { Post, Subreddit } = require("../required/schemas");

const router = express.Router({mergeParams: true});


//comment edit route
router.patch("/", asyncWrap(async (req, res, next) => {
    //gets data from db
    const {subreddit, id, commentIndex} = req.params;
    const body = req.body;
    const post = await Post.findById(id);
    //checks post does exist
    if (post === null) {
        throw new ClientError(404, `Unable to find post ${id} - invalid url`, "post", "get");
    }

    //updates comment
    const curDate = new Date();
    post.comments[commentIndex].text = body.text;
    post.comments[commentIndex].lastModified = curDate;
    let finished = await post.save();
    if (finished != post) {
        throw new ClientError(500, `Unabled to update comment ${comment._id} to ${post._id} - server side error`, "post", "patch");
    }

    //redirct back to post
    res.redirect(`/r/${subreddit}/${id}`);
}));

//comment delete route
router.delete("/", async (req, res, next) => {
    //gets data from db
    const {subreddit, id, commentIndex} = req.params;
    const body = req.body;
    const post = await Post.findById(id);
    //checks post does exist
    if (post === null) {
        throw new ClientError(404, `Unable to find post ${id} - invalid url`, "post", "get");
    }

    //updates comment
    post.comments.splice(commentIndex, 1);
    let finished = await post.save();
    if (finished != post) {
        throw new ClientError(500, `Unabled to update comment ${comment._id} to ${post._id} - server side error`, "post", "patch");
    }

    //redirect back to post
    res.redirect(`/r/${subreddit}/${id}`)
});

module.exports = router;