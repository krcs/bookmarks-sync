const express = require('express');
const fsp = require('fs').promises;
const fs = require('fs');
const path = require('path');

class BookmarkStorage {
    #folder = null;

    constructor(folder) {
        this.#folder = folder;
    }

    async init() {
        if (!fs.existsSync(this.#folder)) {
            await fsp.mkdir(this.#folder, { 
                recursive: true
            });
        }
    }

    async save(name, data) {
        const file = path.join(this.#folder, `${name}.json`);
        await fsp.writeFile(file, JSON.stringify(data));
    }

    async get(name) {
        const file = path.join(this.#folder, `${name}.json`);
        if (!fs.existsSync(file))
            return { error: "Bookmarks not found." };

        let result = {};
        try {
            result = JSON.parse(await fsp.readFile(file, 'utf8'));
        } catch(err) {
            result = { error: err.kessage };
        }

        return result;
    }
}

class Server {
    #app = null;
    #server = null;
    #bookmarkStorage = null;
    #isRunning = false;

    #port = 64666;

    constructor(bookmarkStorage) {
        this.#bookmarkStorage = bookmarkStorage;
        this.#app = express();
        this.#app.use(express.json({limit: '4mb'}));

        this.#app.get('/get/:id', async (req, res) => {
            try {
                res.json(await this.#bookmarkStorage.get(req.params.id));
            } catch(err) {
                res.status(400).end(err.message);
            }
        });

        this.#app.post('/save/:id', async (req, res) => {
            try {
                await this.#bookmarkStorage.save(req.params.id, req.body);
                res.end("OK");
            } catch(err) {
                res.status(400).end(err.message);
            }
        });
    }

    async start() {
        await this.#bookmarkStorage.init();

        if (this.#isRunning) {
            console.log("Server is already running.");
            return;
        }
        this.#server = await this.#app.listen(this.#port);
        this.#isRunning = true;
        console.log("Server started.");

    }

    async stop() {
        if (!this.#isRunning) {
            console.log("Server is already stopped.");
            return;
        }
        await this.#server.close();
        this.#isRunning = false;
        console.log("Server stopped.");
    }
}

(async() => {
    const bookmarkStorage = new BookmarkStorage("./storage/");
    const server = new Server(bookmarkStorage);
    await server.start();
})();
