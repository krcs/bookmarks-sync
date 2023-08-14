async function importChildren(node, parentId) {
    await clearTree(parentId); 

    for (let b of node.children)
        await importTree(b, parentId);
}

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

async function clearTree(folder) {
    const tree = await browser.bookmarks.getSubTree(folder);
    for (let node of tree[0].children)
        await browser.bookmarks.removeTree(node.id);
}

browser.runtime.onMessage.addListener((data, sender, sendResponse) => {
    const folder = "toolbar_____";

    if (data === 'save') {
        Promise.allSettled([ 
            browser.storage.local.get(),
            browser.bookmarks.getSubTree(folder)])
            .then((data) => {
                const url = `http://${data[0].value.server}/save/${data[0].value.id}`;
                const bookmarks = data[1].value[0];
                return fetch(url, {
                    method: "post",
                    mode: "cors",
                    cache: "no-cache",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    redirect: "follow",
                    referrerPolicy: "no-referrer",
                    body: JSON.stringify(bookmarks)
                });
            })
            .then(() => {
                sendResponse({ erorr: false, message: "Ok" });
            })
            .catch((err) => {
                sendResponse({ error: true, message: err.message });
                console.error(err);
            });
    } else if (data === 'load') {
        browser.storage.local.get()
            .then((settings) => {
                const url = `http://${settings.server}/get/${settings.id}`;
                return fetch(url);
            })
            .then((response) => {
                return response.json();
            })
            .then((bookmarks) => {
                return importChildren(bookmarks, folder);
            })
            .then(() => {
                sendResponse({ error: false, message: "Ok" });
            })
            .catch((err) => {
                sendResponse({ error: true, message: err.message });
                console.error(err);
            });
    }
    return true;
});
