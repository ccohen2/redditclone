//makes each post clickable - takes to the view page
const posts = document.querySelectorAll(".card");
for (let post of posts) {
    post.addEventListener("click", (e) => {
        post.children.link.click();
    });
}