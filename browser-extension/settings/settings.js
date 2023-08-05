document.addEventListener('DOMContentLoaded', (e) => {
    const settings = browser.storage.local.get();
    settings.then((res) => {
        document.querySelector("#server").value = res.server || "";
        document.querySelector("#identifier").value = res.id || "";
    });
    e.preventDefault();
});

document.querySelector("form").addEventListener("submit", (e) => {
    const server = document.querySelector("#server").value;
    const identifier = document.querySelector("#identifier").value;
    browser.storage.local.set({
        server: server,
        id: identifier
    });
    e.preventDefault();
});
