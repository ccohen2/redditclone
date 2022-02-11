const mongoose = require('mongoose');

//mongoose initialization - connects to db
mongoose.connect('mongodb://localhost:27017/RedditData')
.then((data) => {console.log("CONNECTED")})
.catch((error) => {
    console.log(`Error connecting to database \n ${error}`);
    process.exit(1);
});
mongoose.connection.on("error", error => {
    console.log(error);
});

module.exports = mongoose;