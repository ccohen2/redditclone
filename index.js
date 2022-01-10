
const express = require("express");
const data = require("./posts.json"); //get rid of once done updating
const path = require("path");
const { v4: uuid } = require("uuid");
const methodOverride = require("method-override");
const mongoose = require('mongoose');

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

//quick reference to root of website
//const homePath = "http://localhost:3000";

//NO REAL ERROR HANDLING YET
// Subreddit.findOne({name: "tennis"}).then(data => {
//     console.log(data);
// });
// Subreddit.findOne({name: "tenni"}).then(data => {
//     console.log(data);
// });

//SUBREDDIT PAGES
//home index route - working for db
app.get("/r/:subreddit", (req, res) => {
    const { subreddit } = req.params;
    Subreddit.findOne({name: subreddit})
    .then(page => {
        //creates new subreddit if no subreddit found - CHANGE TO CANNOT FIND SUBREDDIT - MAKE NEW FORM ON REDDIT HOMEPAGE FOR MAKING SUBREDDIT
        if (typeof (page) === typeof (null)) {
            //no such page
            // page = {
            //     "name": `${subreddit[0].toUpperCase()}${subreddit.slice(1)} Subreddit`,
            //     "subscribers": "N/A",
            //     "description": `Subreddit about all things ${subreddit}`,
            //     "posts": []
            // }
            // data[subreddit] = page;
        }
        //this should probably bet switched to a client side script? - should do research
        //maybe build new request route and have axios request the info client side
        //builds list of posts to display on page
        Post.find({_id: page.posts}).sort({datePosted: -1})
            .then(posts => { res.render("redditPage", { "page": page, "posts": posts, "subreddit": subreddit })})
            .catch(e => res.render("404", {"error": e, "message": `Error, unabled to find subreddit ${subreddit}`}));

        
    }).catch(error => {
        //implement error page
    });
    
});

//new post post route - full reddit post - updated for db - working
app.post("/r/:subreddit", (req, res) => {
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
    newPost.save();
    Subreddit.updateOne({name: subreddit}, {$addToSet: {posts: newPost._id}}).exec()
        .then(() => res.redirect(`${subreddit}`))
        .catch(e => res.render("404", {"error": e, "message": "Error, unabled to complete post"}));//ERROR LANDING PAGE
});




//POST PAGES
//view route - working for db
app.get("/r/:subreddit/:id", (req, res) => {
    const { subreddit, id } = req.params;
    Post.findById(id).exec()
    .then((page) => res.render("postPage", { "page": page, "subreddit": subreddit, "id": id }))
    .catch(e => res.render("404", {"error": e, "message": "Error, unabled to find post"}));//ERROR LANDING PAGE
});

//patch route - working for db
app.patch("/r/:subreddit/:id", (req, res) => {
    const { subreddit, id } = req.params;
    Post.findByIdAndUpdate(id, {text: req.body.text}).exec()
    .then(() => res.redirect(`${id}`))
    .catch(e => res.render("404", {"error": e, "message": "Error, unabled to edit post"}));
    
});

//delete route
app.delete("/r/:subreddit/:id", (req, res) => {
    const { subreddit, id } = req.params;
    Post.findByIdAndDelete(id)
    .then(() => res.redirect(`/r/${subreddit}`))
    .catch(e => res.render("404", {"error": e, "message": "Error, unabled to delete post"}));
});

//comment post route - creates new comment and appends it to post comment array
app.post("/r/:subreddit/:id", async (req, res) => {
    const {subreddit, id} = req.params;
    const post = await Post.findById(id);
    const body = req.body;
    const curDate = new Date();
    const comment = {
        _id: new mongoose.Types.ObjectId(),
        text: body.text,
        author: body.username,
        datePosted: curDate,
        lastModified: curDate
    };

    post.comments.push(comment);
    post.save();
    res.render("postPage", { "page": post, "subreddit": subreddit, "id": id });
});

//comment edit route
app.patch("/r/:subreddit/:id/:commentIndex", async (req, res) => {
    //gets data from db
    const {subreddit, id, commentIndex} = req.params;
    const body = req.body;
    const post = await Post.findById(id);

    //updates comment
    const curDate = new Date();
    post.comments[commentIndex].text = body.text;
    post.comments[commentIndex].lastModified = curDate;
    post.save();

    //redirct back to post
    res.redirect(`/r/${subreddit}/${id}`);
});

//comment delete route
app.delete("/r/:subreddit/:id/:commentIndex", async (req, res) => {
    //gets data from db
    const {subreddit, id, commentIndex} = req.params;
    const body = req.body;
    const post = await Post.findById(id);

    //updates comment
    post.comments.splice(commentIndex, 1);
    post.save();

    //redirect back to post
    res.redirect(`/r/${subreddit}/${id}`)
});

//starts server
app.listen(3000, () => {
    console.log("Listening on port 3000");
});


