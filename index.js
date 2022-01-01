const express = require("express");
const data = require("./posts.json");
const path = require("path");
const { v4: uuid } = require("uuid");
const methodOverride = require("method-override");

const app = express();

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ "extended": true }));
app.use(methodOverride('_method'));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

//quick reference to root of website
const homePath = "http://localhost:3000";

//NO REAL ERROR HANDLING YET


//subreddit pages
//home
//index route
app.get("/r/:subreddit", (req, res) => {
    const { subreddit } = req.params;
    let page = data[subreddit];
    //creates new subreddit if no subreddit found
    if (typeof (page) === typeof (undefined)) {
        page = {
            "name": `${subreddit[0].toUpperCase()}${subreddit.slice(1)} Subreddit`,
            "subscribers": "N/A",
            "description": `Subreddit about all things ${subreddit}`,
            "posts": []
        }
        data[subreddit] = page;
    }
    res.render("redditPage", { "page": page, "subreddit": subreddit });
});

//post route - full reddit post
app.post("/r/:subreddit", (req, res) => {
    const { subreddit } = req.params;
    let body = req.body;
    let newPost = {
        "title": body.title,
        "author": body.username,
        "text": body.text,
        "img": body.imgSrc
    }
    data[subreddit].posts[uuid()] = newPost;

    res.redirect(`${subreddit}`);
});

//post pages
//view route
app.get("/r/:subreddit/:id", (req, res) => {
    const { subreddit, id } = req.params;
    let page = data[subreddit].posts[id];
    //throws 404 if no page found
    if (typeof (page) === typeof (undefined)) {
        res.render("404")
    }
    res.render("postPage", { "page": page, "subreddit": subreddit, "id": id });

});

//post route - comments

//patch route
app.patch("/r/:subreddit/:id", (req, res) => {
    const { subreddit, id } = req.params;
    data[subreddit].posts[id].text = req.body.text;
    res.redirect(`${id}`);
});

//delete route
app.delete("/r/:subreddit/:id", (req, res) => {
    try {
        const { subreddit, id } = req.params;
        delete data[subreddit].posts[id];
        return res.json({ "res": 1} );
    }
    catch (e) {
        return res.json({ "res": e});
    }
});

app.listen(3000, () => {
    console.log("Listening on port 3000");
});


