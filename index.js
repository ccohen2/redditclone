
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const mongoose = require('mongoose');
const { Post, Subreddit } = require("./required/schemas");
const { ClientError } = require("./required/errors");

//express initialization
const app = express();

//extress settings - abosolute path, get data from forms, overide
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ "extended": true }));
app.use(methodOverride('_method'));

//allows for ejs docs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

//mongoose initialization - connects to subreddits and posts dbs
mongoose.connect('mongodb://localhost:27017/RedditData')
.then((data) => {console.log("CONNECTED")});

//quick reference to root of website
//const homePath = "http://localhost:3000";

//NO REAL ERROR HANDLING YET
// Subreddit.findOne({name: "tennis"}).then(data => {
//     console.log(data);
// });
// Subreddit.findOne({name: "tenni"}).then(data => {
//     console.log(data);
// });

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










//SUBREDDIT PAGES
//home index route - working for asyncWrap
app.get("/r/:subreddit", asyncWrap(async (req, res, next) => {
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













//POST PAGES
//view route - working for db
app.get("/r/:subreddit/:id", asyncWrap (async (req, res, next) => {
    const { subreddit, id } = req.params;
    let page = await Post.findById(id);
    //if page isn't found, throw not found error
    if (page === null) {
        throw new ClientError(404, `Cannot find post ${id} - post does not exist`, "post", "get");
    }

    res.render("postPage", { "page": page, "subreddit": subreddit, "id": id });
}));

//new post post route - full reddit post - updated for db - working
app.post("/r/:subreddit", asyncWrap(async (req, res, next) => {
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

//patch route - working for db
app.patch("/r/:subreddit/:id", asyncWrap(async (req, res, next) => {
    const { subreddit, id } = req.params;
    let post = await Post.findByIdAndUpdate(id, {text: req.body.text});
    //throw error if no document found
    if (post === null) {
        throw new ClientError(404, `Unable to update ${id} - post does not exist`, "post", "patch");
    }

    res.redirect(`${id}`);
}));

//delete route
app.delete("/r/:subreddit/:id", asyncWrap(async (req, res, next) => {
    const { subreddit, id } = req.params;
    let post = await Post.findByIdAndDelete(id);
    if (post === null) {
        throw new ClientError(404, `Unable to delete ${id} - post does not exist`, "post", "delete");
    }

    res.redirect(`/r/${subreddit}`);
}));

//comment post route - creates new comment and appends it to post comment array
app.post("/r/:subreddit/:id", asyncWrap(async (req, res, next) => {
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

    res.render("postPage", { "page": post, "subreddit": subreddit, "id": id });
}));

//comment edit route
app.patch("/r/:subreddit/:id/:commentIndex", asyncWrap(async (req, res, next) => {
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
app.delete("/r/:subreddit/:id/:commentIndex", async (req, res, next) => {
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









//error handling middleware
app.use((error, req, res, next) => {
    //implement error handling page
    console.log(error.stack);
    res.send(`${error.statusCode}: ${error.statusMessage}`);
});








//starts server
app.listen(3000, () => {
    console.log("Listening on port 3000");
});


