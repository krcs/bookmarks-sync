const ERROR_COLOR = "#FF5050";
const INFO_COLOR = "#00FF00";

function log(element, value, type) {
    element.style.color = type === "error" 
        ? ERROR_COLOR 
        : INFO_COLOR;

    if (Array.isArray(value))
        element.value = value.join("\r\n");
    else
        element.value = value;
}

async function sync(command, logElement) {
    let logText = "Unknown command.";

    if (command === "save") {
        logText = "Saving...";
    }
    else if (command === "load") {
        logText = "Loading...";
    }
    else {
        log(logElement, logText);
        return false;
    }
    log(logElement, logText);

    browser.runtime.sendMessage(command)
        .then((response) => {
            if (response.error) 
                log(logElement, [ 
                    `${logText}Error`, 
                    response.message 
                ], "error");
            else
                log(logElement, `${logText}${response.message}`);
        })
        .catch((err) => {
            log(logElement, err.message, "error");
        });

    return true;
}

document.addEventListener('DOMContentLoaded', (e) => {
    const saveBtn = document.getElementById("saveBtn");
    const loadBtn = document.getElementById("loadBtn");

    const logElement = document.getElementById("log");

    saveBtn.addEventListener("click", (e)=> {
        saveBtn.disabled = loadBtn.disabled = true;

        sync("save", logElement)
            .then(() => {
                saveBtn.disabled = loadBtn.disabled = false;
            });

        e.preventDefault();

    });

    loadBtn.addEventListener("click", (e)=> {
        saveBtn.disabled = loadBtn.disabled = true;

        sync("load", logElement)
            .then(() => {
                saveBtn.disabled = loadBtn.disabled = false;
            });

        e.preventDefault();
    });
});
