
//handles button events - changes elements for editing or out of editing
const editBtn = document.querySelector(".post #editBtn");
const btnGroup = document.querySelector(".post .btn-group");
const saveBtn = document.querySelector(".post .btn-group #saveBtn");
const cancelBtn = document.querySelector(".post .btn-group #cancelBtn");
const deleteBtn = document.querySelector(".post .btn-group #deleteBtn")

const editForm = document.querySelector(".post #editForm");
const postText = document.querySelector(".post .postText");
const deleteForm = document.querySelector(".post #deleteForm");

//extract id from url
let url = window.location.href.split("/");
const id = url.pop();
const subreddit = url.pop();


//edit button events
editBtn.addEventListener("click", (e) => {
    editBtn.style.display = "none";
    btnGroup.style.display = "inline-flex";
    
    editForm.style.display = "flex";
    postText.style.display = "none";
});

//save changes btn events
saveBtn.addEventListener("click", (e) => {
    editForm.submit();
});

//cancel button events
cancelBtn.addEventListener("click", (e) => {
    editBtn.style.display = "block";
    btnGroup.style.display = "none";
    
    editForm.style.display = "none";
    postText.style.display = "block";
});

//delete button event
deleteBtn.addEventListener("click", (e) => {
    deleteForm.submit();
});