const express = require("express");
const mongoose = require("../required/mongoose");
const { asyncWrap } = require("../required/helperFunctions")
const { ClientError } = require("../required/errors");
const { Post, Subreddit, User } = require("../required/schemas");
const bcrypt = require("bcrypt");

const router = express.Router({mergeParams: true});

//login function - used by login and signup
const login = async function(req, res, next) {
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

    return true;
};

//registration
router.get("/signup", (req, res, next) => {
    res.render("signup.ejs", {"query": req.query.q});
});

router.post("/signup", asyncWrap(async (req, res, next) => {
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

    //logs user in
    await login(req, res, next);

    //redirect to reddit homepage - once implemented homepage
    res.redirect(req.query.q);
}));

//user authentication
//login
router.get("/login", (req, res, next) => {
    res.render("login.ejs", {"query": req.query.q});
});

router.post("/login", asyncWrap(async (req, res, next) => {
    //calls login function
    await login(req, res, next);

    res.redirect(req.query.q);
}));

//logout
router.get("/logout", (req, res, next) => {
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

module.exports = router;