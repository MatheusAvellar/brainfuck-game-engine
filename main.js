const {ipcMain, app, BrowserWindow} = require("electron");
const path = require("path");
const url = require("url");

const DEBUG = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let main_window,
    game_window;

let createWindow = function() {
    // Create the browser window.
    main_window = new BrowserWindow({
        width: 800,
        height: 800,
        useContentSize: true,
        webPreferences: {
           experimentalFeatures: true
        },
        show: false,
        resizable: false,
        fullscreen: false,
        fullscreenable: false,
        maximizable: false,
        autoHideMenuBar: true
    });


    // and load the index.html of the app.
    main_window.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true
    }));

    if(DEBUG) main_window.webContents.openDevTools();

    main_window.once("ready-to-show", () => {  main_window.show();  });

    main_window.on("closed", () => {
        main_window = null;
        app.quit();
    });
    main_window.setMenu(null);

    ipcMain.on("run-game", (event, arg) => {
        if(game_window == null) {
            game_window = new BrowserWindow({
                width: 800,
                height: 608,
                minWidth: 800,
                minHeight: 608,
                useContentSize: true,
                webPreferences: {
                   experimentalFeatures: true
                },
                show: false,
                resizable: true,
                fullscreen: false,
                fullscreenable: true,
                maximizable: true,
                autoHideMenuBar: true
            });

            game_window.on("closed", () => {
                game_window = null;
            });

            game_window.once("ready-to-show", () => {
                game_window.show();
                game_window.focus();
                game_window.webContents.send("tape-and-code", arg);
                if(DEBUG) game_window.webContents.openDevTools();
            });

            game_window.loadURL(url.format({
                pathname: path.join(__dirname, "game.html"),
                protocol: "file:",
                slashes: true
            }));
            event.returnValue = "sent";
        } else {
            game_window.webContents.send("tape-and-code", arg);
            game_window.focus();
        }
    });
}

app.commandLine.appendSwitch("enable-webassembly");

app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {  app.quit();  });

app.on("activate", () => {
    if (main_window === null) {
        createWindow();
    }
});