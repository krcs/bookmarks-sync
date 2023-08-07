const express = require('express');
const fsp = require('fs').promises;
const fs = require('fs');
const path = require('path');

class Server {
    #app = null;
    #server = null;
    #isRunning = false;
    #storageFolder = null;
    #port = null;

    constructor(storageFolder, port) {
        this.#port = port;
        this.#storageFolder = storageFolder;
        this.#app = express();
        this.#app.use(express.json({
            limit: '4mb'
        }));

        this.#app.get('/get/:id', async (req, res) => {
            const file = path.join(this.#storageFolder, `${req.params.id}.json`);

            fsp.readFile(file, "utf8")
                .then((data) => {
                    res.json(JSON.parse(data));
                })
                .catch((err) => {
                    res.status(400).end(err.message);
                });
        });

        this.#app.post('/save/:id', (req, res) => {
            const file = path.join(this.#storageFolder, `${req.params.id}.json`);

            fsp.writeFile(file, JSON.stringify(req.body))
                .then(() => { 
                    res.end("Saved."); 
                })
                .catch((err) => {
                    res.status(400).end(err.message);
                });
        });
    }

    async start() {
        if (this.#isRunning) {
            console.log("Server is already running.");
            return;
        }

        fs.mkdirSync(this.#storageFolder, { recursive: true });

        this.#server = await this.#app.listen(this.#port);
        this.#isRunning = true;
        console.log("Server started.");
    }
}

(async() => {
    const server = new Server("./storage/", 64666);
    await server.start();
})();
