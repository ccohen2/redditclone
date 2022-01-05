
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
.then((data) => {console.log("CONNECTED")});//CHECK THIS IS HOW TO QUERY DATABASE});

//initializes schema for subreddits and posts
const Subreddit = mongoose.model('subreddit', { 
    name: String, 
    subscribers: Number,
    description: String,
    posts: Array
});
const Post = mongoose.model('post', { 
    title: String,
    author: String,
    text: String,
    img: String,
    comments: Array,
    datePosted: Date,
    lastModified: Date 
});

//quick reference to root of website
const homePath = "http://localhost:3000";

//NO REAL ERROR HANDLING YET
// Subreddit.findOne({name: "tennis"}).then(data => {
//     console.log(data);
// });
// Subreddit.findOne({name: "tenni"}).then(data => {
//     console.log(data);
// });

//subreddit pages
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

//post route - full reddit post - updated for db - working
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

//post pages
//view route - working for db
app.get("/r/:subreddit/:id", (req, res) => {
    const { subreddit, id } = req.params;
    Post.findById(id).exec()
    .then((page) => res.render("postPage", { "page": page, "subreddit": subreddit, "id": id }))
    .catch(e => res.render("404", {"error": e, "message": "Error, unabled to find post"}));//ERROR LANDING PAGE
});

//post route - comments

//patch route - working for db
app.patch("/r/:subreddit/:id", (req, res) => {
    const { subreddit, id } = req.params;
    Post.findByIdAndUpdate(id, {text: req.body.text})
    .then(() => res.redirect(`${id}`))
    .catch(e => res.render("404", {"error": e, "message": "Error, unabled to edit post"}));
    
});

//delete route
app.delete("/r/:subreddit/:id", (req, res) => {
    const { subreddit, id } = req.params;
    Post.findByIdAndDelete(id)
    .then(() => res.redirect(`http://localhost:3000/r/${subreddit}`))
    .catch(e => res.render("404", {"error": e, "message": "Error, unabled to delete post"}));
});

//starts server
app.listen(3000, () => {
    console.log("Listening on port 3000");
});


