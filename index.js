
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const { Post, Subreddit, User } = require("./required/schemas");
const { ClientError } = require("./required/errors");
const { asyncWrap } = require("./required/helperFunctions");
const bcrypt = require("bcrypt");


const mongoose = require("./required/mongoose");
//routers
const subredditRouter = require("./routes/subreddit");
const sessionRouter = require("./routes/session");

//express initialization
const app = express();

//session settings and middlewear for authentication
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'dont guess me'
}));



//extress settings - abosolute path, get data from forms, overide
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json())
app.use(express.urlencoded({ "extended": true }));
app.use(methodOverride('_method'));

//allows for ejs docs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

//quick reference to root of website
//const homePath = "http://localhost:3000";

//NO REAL ERROR HANDLING YET
// Subreddit.findOne({name: "tennis"}).then(data => {
//     console.log(data);
// });
// Subreddit.findOne({name: "tenni"}).then(data => {
//     console.log(data);
// });

//SUBREDDIT PAGES - all subroutes handled by router
app.use("/r/:subreddit", subredditRouter);

//users handling - login, logout, register
app.use("/session", sessionRouter);


//home - try moving this to /r but before /r/:subreddit - everything should work as long as no /r/:something in /r
app.get("/home", asyncWrap(async (req, res, next) => {
    const user = req.session.user;
    const subscriptions = [];

    //specific to if user is signed in
    //gets subscribed subreddits
    if (user !== null && user !== undefined) {
        //gets user from db
        const userObj = await User.findOne({username: user});
        if (userObj === null) {
            throw new ClientError(404, `Unable fo find user ${user}`, "user", "get");
        }

        //gets 5 random subsriptions
        let sampleSubs = [...userObj.subscriptions];
        for (let i = 0; i < Math.min(userObj.subscriptions.length, 5); i++) {

            //gets random subreddit - change algorithm - there are currently potential duplicates
            let index = Math.floor(Math.random() * sampleSubs.length);
            const subreddit = await Subreddit.findById(sampleSubs[index]);

            //checks subreddit exists
            if (subreddit === null) {
                throw new ClientError(404, `Unable fo find subreddit`, "subreddit", "get");
            }

            //gets 4 most recent posts from subreddit
            let posts = await Post.find({_id: subreddit.posts});
            posts = posts.slice(0, Math.min(posts.length, 4));

            subscriptions.push({
                name: subreddit.name, 
                posts: posts
            });

            sampleSubs.splice(index, 1);
        }
    }


    res.render("home.ejs", {
        "user": user,
        "subscriptions": subscriptions,
        "originalUrl": req.originalUrl });
}));


//test link for username
app.get("/test", (req, res, next) => {
    res.send(`${req.session.user}`);
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


