
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const { User } = require("./required/schemas");
const { ClientError } = require("./required/errors");
const asyncWrap = require("./required/helperFunctions");
const bcrypt = require("bcrypt");


const mongoose = require("./required/mongoose");
//routers
const subredditRouter = require("./routes/subreddit");

//express initialization
const app = express();

//session settings and middlewear for authentication
app.use(session({
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
    res.render("login.ejs");
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

    res.send("logged in!");
}));

//logout
app.get("/logout", (req, res, next) => {
    res.render("logout");
})

app.post("/logout", (req, res, next) => {
    try {
        //checks if user is logged in - if so logs them out
        if (req.session.user !== null) {
            req.session.user = null;
        }
        else if (req.session.user === null) {
            res.send("NOT LOGGED IN");
        }
    } 
    //sets user to null - in case user variable in session hasn't been initialized
    catch {
        req.session.user === null;
        res.send("NOT LOGGED IN")
    }

    //redirect to home page with flash message
    res.send("Successfully logged out");
});

app.get("/test", (req, res, next) => {
    res.send(`${req.session.user}`);
})







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


