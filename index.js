
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");

//routers
const subredditRouter = require("./routes/subreddit");

//express initialization
const app = express();

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


