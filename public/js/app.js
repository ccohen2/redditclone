
//makes each post clickable - takes to the view page
const posts = document.querySelectorAll(".post");
for (let post of posts) {
    post.addEventListener("click", (e) => {
        post.children.link.click();
    });
}

//handles subscribing with axios
const subBtn = document.querySelector("#subscribe");
let subredditName = window.location.href.split("/");
subredditName = subredditName[subredditName.length - 1];
subBtn.addEventListener("click", (e) => {
    if (subBtn.textContent === "Subscribe") {
        axios.post(`http://localhost:3000/r/${subredditName}/sub`)
        .catch(e => {
            console.log("Unable to subscribe", e)});
        subBtn.textContent = "Unsubscribe";
    }
    else if (subBtn.textContent === "Unsubscribe") {
        axios.post(`http://localhost:3000/r/${subredditName}/sub?q=unsub`)
        .catch(e => {
            console.log("Unable to unsubscribe", e)});
        subBtn.textContent = "Subscribe";
    }

});