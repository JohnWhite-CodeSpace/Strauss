import {app, BrowserWindow} from "electron";
import path from "path";
import {spawn} from "child_process";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;


function getBackendName(){

    if(process.platform === "win32"){
        return "StraussBackend.exe";
    }

    return "StraussBackend";
}


function getBackendPath(){

    const backendName = getBackendName();

    return app.isPackaged
        ? path.join(process.resourcesPath, "backend", backendName)
        : path.join(__dirname, "..", "StraussModule", "python_core", "dist", "StraussBackend", backendName);
}


function getWindowIcon(){

    if(process.platform === "win32"){
        return path.join(__dirname, "..", "build", "icon.ico");
    }

    if(process.platform === "darwin"){
        return path.join(__dirname, "..", "build", "icon.icns");
    }

    return path.join(__dirname, "..", "build", "icon.png");
}


function startBackend(){

    const backendPath = getBackendPath();

    console.log(`[BACKEND] Starting: ${backendPath}`);

    backendProcess = spawn(backendPath, [], {
        windowsHide: process.platform === "win32"
    });

    backendProcess.stdout.on("data", (data) => {console.log(`[BACKEND] ${data}`);});
    backendProcess.stderr.on("data", (data) => {console.error(`[BACKEND ERROR] ${data}`);});
    backendProcess.on("error", (error) => {console.error("[BACKEND] Failed to start:", error);});
    backendProcess.on("exit", (code) => {console.log(`[BACKEND] Process exited with code ${code}`);});
}


function createWindow(){

    mainWindow = new BrowserWindow({width: 1600, height: 1000, minWidth: 1000, minHeight: 700,
        icon: getWindowIcon(),
        webPreferences: {contextIsolation: true, nodeIntegration: false}
    });

    mainWindow.loadFile(path.join(__dirname, "..", "index.html"));
}


app.whenReady().then(() => {
    startBackend();
    createWindow();
});


app.on("window-all-closed", () => {
    if(process.platform !== "darwin"){
        app.quit();
    }
});


app.on("activate", () => {
    if(BrowserWindow.getAllWindows().length === 0){
        createWindow();
    }
});


app.on("before-quit", () => {
    if(backendProcess && !backendProcess.killed){
        backendProcess.kill();
    }
});