const Encoder = new TextEncoder();
const Decoder = new TextDecoder();

async function encrypt(content, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await getKey(password, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const contentBytes = Encoder.encode(content);

    const cipher = new Uint8Array(
        await crypto.subtle.encrypt({ 
            name: "AES-GCM", 
            iv 
        }, key, contentBytes)
    );

    return {
        salt: bytesToBase64(salt),
        iv: bytesToBase64(iv),
        cipher: bytesToBase64(cipher),
    };
}

async function decrypt(encryptedData, password) {
    const salt = base64ToBytes(encryptedData.salt);
    const key = await getKey(password, salt);
    const iv = base64ToBytes(encryptedData.iv);

    const cipher = base64ToBytes(encryptedData.cipher);
    const contentBytes = new Uint8Array(
        await crypto.subtle.decrypt({ 
            name: "AES-GCM", 
            iv 
        }, key, cipher)
    );

    return Decoder.decode(contentBytes);
}

async function getKey(password, salt) {
    const passwordBytes = Encoder.encode(password);

    const initialKey = await crypto.subtle.importKey(
        "raw",
        passwordBytes,
        { 
            name: "PBKDF2"
        },
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
       { 
           name: "PBKDF2", 
           salt, 
           iterations: 100000,
           hash: "SHA-256" 
       },
       initialKey,
       { 
           name: "AES-GCM",
           length: 256
       },
       false,
       ["encrypt", "decrypt"]
    );
}

function bytesToBase64(arr) {
    return btoa(Array.from(arr, (b) => String.fromCharCode(b)).join(""));
}

function base64ToBytes(base64) {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

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

    if (data.command === 'save') {
        Promise.allSettled([ 
            browser.storage.local.get(),
            browser.bookmarks.getSubTree(folder)
            .then((tree) => {
                return encrypt(JSON.stringify(tree[0]), data.password);
            })])
            .then((data) => {
                const url = `http://${data[0].value.server}/save/${data[0].value.id}`;
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
                    body: JSON.stringify(data[1].value)
                });
            })
            .then(() => {
                sendResponse({ erorr: false, message: "Ok" });
            })
            .catch((err) => {
                sendResponse({ error: true, message: err.message });
                console.error(err);
            });
    } else if (data.command === 'load') {
        browser.storage.local.get()
            .then((settings) => {
                const url = `http://${settings.server}/get/${settings.id}`;
                return fetch(url);
            })
            .then((response) => {
                return response.json();
            })
            .then((response) => {
                return decrypt(response, data.password);
            })
            .then((bookmarks) => {
                return importChildren(JSON.parse(bookmarks), folder);
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
