// BookmarkTreeNode -> CreateDetails
function treeNode2createDetails(treeNode) {
    return {
        index: treeNode.index,
        parentId: treeNode.parentId,
        title: treeNode.title,
        type: treeNode.type,
        url: treeNode.url,
        children : []
    }
}

function traverse(node) {
    return new Promise((resolve, reject) => {
        const result = treeNode2createDetails(node);
        for (let child of node.children) {
            const cd = treeNode2createDetails(child);
            result.children.push(cd);
            if (child.children)
                cd.children = traverse(child).children;
        }
        resolve(result);
    });
}

async function createTree(node, parentId) {
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
        await createTree(child, bookmark.id);
}

async function send() {
    const folder = "toolbar_____";

    const settings = await browser.storage.local.get();

    browser.bookmarks.getSubTree(folder)
        .then((tree) => traverse(tree[0]))
        .then((tree) => createTree(tree, folder));
}

async function receive() {
    const settings = await browser.storage.local.get();
    console.log(settings);
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
