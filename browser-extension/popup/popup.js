async function importTree(node, parentId) {
    const bookmark = await browser.bookmarks.create({
        index: node.index,
        title: node.title,
        parentId: parentId,
        type: node.type,
        url: node.url
    });

    if (!node.children)
        return;

    for (let child of node.children)
        await importTree(child, bookmark.id);
}

async function send() {
    const folder = "toolbar_____";

    const settings = await browser.storage.local.get();
    const url = `http://${settings.server}/save/${settings.id}`;

    await browser.bookmarks.getSubTree(folder)
        .then((tree) => { 
            fetch(url, {
                method: "post",
                mode: "cors",
                cache: "no-cache",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                redirect: "follow",
                referrerPolicy: "no-referrer",
                body: JSON.stringify(tree[0])
            });
        }).catch((err) => {
            console.error(err);
        });
}

async function receive() {
    const settings = await browser.storage.local.get();
    const url = `http://${settings.server}/get/${settings.id}`;

    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            const folder = "toolbar_____";
            importTree(data, folder);
        })
        .catch((err) => {
            console.error(err);
        });
}

document.addEventListener('DOMContentLoaded', (e) => {
    const sendBtn = document.querySelector("#sendBtn");
    const receiveBtn = document.querySelector("#receiveBtn");

    sendBtn.addEventListener("click", (e)=> {
        send();
        e.preventDefault();
    });

    receiveBtn.addEventListener("click", (e)=> {
        receive();
        e.preventDefault();
    });
});
