const express = require("express");
const mongoose = require("../required/mongoose");
const { asyncWrap, protect } = require("../required/helperFunctions")
const { ClientError } = require("../required/errors");
const { Post, Subreddit } = require("../required/schemas");
const commentRouter = require("./comment");

const router = express.Router({mergeParams: true});


//view route - working for db
router.get("/", asyncWrap (async (req, res, next) => {
    const { subreddit, id } = req.params;
    let page = await Post.findById(id);
    //if page isn't found, throw not found error
    if (page === null) {
        throw new ClientError(404, `Cannot find post ${id} - post does not exist`, "post", "get");
    }

    res.render("postPage", { "page": page, 
        "subreddit": subreddit, 
        "id": id, 
        "user": req.session.user, 
        "originalUrl": `${req.originalUrl}`});
}));

//patch route - working for db
router.patch("/", protect("post", "patch"), asyncWrap(async (req, res, next) => {
    const { subreddit, id } = req.params;
    let post = res.locals.item;
    post.text = req.body.text;
    let finished = await post.save();
    //throw error if no document found
    if (finished != post) {
        throw new ClientError(500, `Unable to update post ${id} - server side error`, "post", "patch");
    }

    res.redirect(`${id}`);
}));

//delete route
router.delete("/", protect("post", "delete"), asyncWrap(async (req, res, next) => {
    const { subreddit, id } = req.params;
    let post = await Post.findByIdAndDelete(id);
    if (post === null) {
        throw new ClientError(404, `Unable to delete ${id} - post does not exist`, "post", "delete");
    }

    //updates subreddit so id is no longer it set of post ids
    let finished = await Subreddit.updateOne({name: subreddit}, {$pull: {posts: post._id}});
    if (finished.modifiedCount != 1) {
        throw new ClientError(404, `Unable to update subreddit ${subreddit} with post id ${newPost._id} - server side error`, "subreddit", "patch");
    }

    res.redirect(`/r/${subreddit}`);
}));

//comment post route - creates new comment and appends it to post comment array
router.post("/", asyncWrap(async (req, res, next) => {
    const {subreddit, id} = req.params;
    const post = await Post.findById(id);
    //checks post does exist
    if (post === null) {
        throw new ClientError(404, `Unable to find post ${id} - invalid url`, "post", "get");
    }
    const body = req.body;
    const curDate = new Date();
    const comment = {
        _id: new mongoose.Types.ObjectId(),
        text: body.text,
        author: body.username,
        datePosted: curDate,
        lastModified: curDate
    };

    //updates post and checks update was successful
    post.comments.push(comment);
    let finished = await post.save();
    if (finished != post) {
        throw new ClientError(500, `Unabled to post comment ${comment._id} to ${post._id} - server side error`, "post", "post");
    }

    res.redirect(`/r/${subreddit}/${id}`);
}));


//handles comments
router.use("/:commentIndex", commentRouter);


module.exports = router;