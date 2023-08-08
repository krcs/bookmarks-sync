document.addEventListener('DOMContentLoaded', (e) => {
    const sendBtn = document.querySelector("#sendBtn");
    const receiveBtn = document.querySelector("#receiveBtn");

    sendBtn.addEventListener("click", (e)=> {
        browser.runtime.sendMessage("save");
        e.preventDefault();
    });

    receiveBtn.addEventListener("click", (e)=> {
        browser.runtime.sendMessage("load");
        e.preventDefault();
    });
});
