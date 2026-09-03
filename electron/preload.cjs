const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {

    openPresentation: () =>
        ipcRenderer.invoke("open-presentation"),

    openConfig: () =>
        ipcRenderer.invoke("open-config")

});