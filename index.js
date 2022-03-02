
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

//users
//registration
app.get("/signup", (req, res, next) => {
    res.render("signup.ejs");
});

app.post("/signup", asyncWrap(async (req, res, next) => {
    const { username, password, confirmpassword } = req.body;
    //checks passwords match
    if (password != confirmpassword) {
        throw new ClientError(500, "Passwords do not match!!", "user", "post");
    }
    const user = new User({username, password});

    const finished = await user.save();
    //checks user was saved to database
    if (finished != user) {
        throw new ClientError(500, `Unabled to create new user - server side error`, "user", "post");
    }

    //redirect to reddit homepage - once implemented homepage
    res.send("Created new user!!");
}));

//user authentication
//login
app.get("/login", (req, res, next) => {
    res.render("login.ejs", {"query": req.query.q});
});

app.post("/login", asyncWrap(async (req, res, next) => {
    const { username, password } = req.body;
    const user = await User.findOne({username: username});
    //checks user exists
    if (user === null) {
        throw new ClientError(404, `Unable fo find user ${username}`, "user", "get");
    }

    //logs user in
    if (bcrypt.compare(password, user.password)) {
        req.session.user = username;
    }
    else {
        res.send("Invalid username or password!!!");
    }

    res.redirect(req.query.q);
}));

//logout
app.get("/logout", (req, res, next) => {
    try {
        //checks if user is logged in - if so logs them out
        if (req.session.user !== null && typeof (req.session.user) !== "undefined") {
            req.session.user = null;
        }
        else if (req.session.user === null || typeof (req.session.user) === "undefined") {
            throw new ClientError(403, "Not Logged in", "user", "post");
        }
    } 
    //sets user to null - in case user variable in session hasn't been initialized
    catch {
        req.session.user = null;
        res.send("NOT LOGGED IN");
    }

    //redirect to home page with flash message
    res.redirect(req.query.q);
});



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

            //gets 6 posts from subreddit
            let posts = await Post.find({_id: subreddit.posts});
            posts = posts.slice(0, Math.min(posts.length, 6));

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


