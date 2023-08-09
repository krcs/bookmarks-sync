#!/usr/bin/node

const yargs = require('yargs/yargs');

const express = require('express');
const cors = require('cors');

const fsp = require('fs').promises;
const fs = require('fs');
const path = require('path');

class Server {
    #app = null;
    #server = null;
    #storageFolder = null;
    #port = null;

    constructor(storageFolder, port) {
        this.#port = port;
        this.#storageFolder = storageFolder;
        this.#app = express();
        this.#app.use(express.json({
            limit: '4mb'
        }));
        this.#app.use(cors());

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
        fs.mkdirSync(this.#storageFolder, { recursive: true });

        this.#server = await this.#app.listen(this.#port);
        console.log(`Server started.\n Storage: ${this.#storageFolder}\n Port: ${this.#port}`);
    }
}

const argv = yargs(process.argv.slice(2))
    .options({
        "storage": {
            alias: "s",
            default: "./storage",
            describe: "File storage folder.",
            demandOption: true,
            type: "string"
        },
        "port": {
            alias: "p",
            default: "64666",
            describe: "Listening port.",
            demandOption: true,
            type: "number"
        }
    })
    .fail((msg, err, yargs) => {
        console.error(msg);
        process.exit(1);
    })
    .version(false)
    .help(false)
    .argv;

(async() => {
    const server = new Server(argv.storage, argv.port);
    await server.start();
})();
