import {app, BrowserWindow, ipcMain, shell, dialog} from "electron";
import path from "path";
import {spawn} from "child_process";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;

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

    let backendPath;

    if(app.isPackaged){

        switch(process.platform){

            case "win32":
                backendPath = path.join(
                    process.resourcesPath,
                    "backend",
                    "StraussBackend.exe"
                );
                break;

            case "linux":
                backendPath = path.join(
                    process.resourcesPath,
                    "backend",
                    "StraussBackend"
                );
                break;

            case "darwin":
                backendPath = path.join(
                    process.resourcesPath,
                    "backend",
                    "StraussBackend"
                );
                break;

            default:
                console.error(`[BACKEND] Unsupported platform: ${process.platform}`);
                return;
        }

    }else{

        switch(process.platform){

            case "win32":
                backendPath = path.join(
                    __dirname,
                    "..",
                    "backends",
                    "win",
                    "StraussBackend-windows",
                    "StraussBackend.exe"
                );
                break;

            case "linux":
                backendPath = path.join(
                    __dirname,
                    "..",
                    "backends",
                    "linux",
                    "StraussBackend-linux",
                    "StraussBackend"
                );
                break;

            case "darwin":
                backendPath = path.join(
                    __dirname,
                    "..",
                    "backends",
                    "mac",
                    "StraussBackend-macos",
                    "StraussBackend"
                );
                break;

            default:
                console.error(`[BACKEND] Unsupported platform: ${process.platform}`);
                return;
        }
    }

    console.log(`[BACKEND] Starting: ${backendPath}`);

    backendProcess = spawn(backendPath, [], {
        windowsHide: process.platform === "win32"
    });

    backendProcess.stdout.on("data", (data) => {
        console.log(`[BACKEND] ${data}`);
    });

    backendProcess.stderr.on("data", (data) => {
        console.error(`[BACKEND ERROR] ${data}`);
    });

    backendProcess.on("error", (error) => {
        console.error("[BACKEND] Failed to start:", error);
    });

    backendProcess.on("exit", (code) => {
        console.log(`[BACKEND] Process exited with code ${code}`);
    });
}


function createWindow(){

    mainWindow = new BrowserWindow({width: 1600, height: 1000, minWidth: 1000, minHeight: 700,
        icon: getWindowIcon(),
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, "preload.cjs")
        }
    });

    mainWindow.loadFile(path.join(__dirname, "..", "index.html"));
}


app.whenReady().then(() => {
    ipcMain.handle("open-presentation", async () => {
    return await openPresentation();
});
    ipcMain.handle("open-config", () => openConfig());
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

async function openPresentation(){

    const pdfPath = app.isPackaged
        ? path.join(process.resourcesPath, "presentation.pdf")
        : path.join(__dirname, "..", "res", "presentation.pdf");

    console.log(`[PRESENTATION] Opening: ${pdfPath}`);

    const error = await shell.openPath(pdfPath);

    if(error){
        console.error(`[PRESENTATION] Failed to open: ${error}`);
        return {success: false, error};
    }

    console.log("[PRESENTATION] Opened successfully");

    return {success: true};
}

async function openConfig(){

    const configsPath = app.isPackaged
        ? path.join(process.resourcesPath, "configs")
        : path.join(__dirname, "..", "configs");

    const result = await dialog.showOpenDialog(mainWindow, {

        title: "Load YAML Configuration",

        defaultPath: configsPath,

        properties: ["openFile"],

        filters: [
            {
                name: "YAML Files",
                extensions: ["yaml", "yml"]
            }
        ]

    });

    if(result.canceled){
        return {
            canceled: true
        };
    }

    const filePath = result.filePaths[0];

    const fs = await import("fs/promises");

    const content = await fs.readFile(filePath, "utf8");

    return {
        canceled: false,
        name: path.basename(filePath),
        content: content
    };
}