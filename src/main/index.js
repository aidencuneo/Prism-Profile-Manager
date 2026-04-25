import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { homedir } from 'os';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

let instancePath = join(homedir(), 'AppData/Roaming/PrismLauncher/instances');

async function readdir(path) {
    return await fs.readdir(path, { withFileTypes: true });
}

ipcMain.handle('getInstances', async () => {
    try {
        let folders = await readdir(instancePath);

        return folders
            .filter(e => e.isDirectory() && !e.name.startsWith('.'))
            .map(e => e.name);
    } catch (error) {
        return false;
    }
});

ipcMain.handle('exportModpack', async (event, name) => {
    let path = join(instancePath, name);
    let pathMC = join(path, 'minecraft');
    let newPath = join(instancePath, name + '_EXPORT');
    let newPathMC = join(newPath, 'minecraft');

    await fs.mkdir(newPathMC, { recursive: true });
    console.log('Exporting modpack:', name);

    // Copy root files
    for (let dirent of await readdir(path)) {
        console.log(dirent);
        if (dirent.isFile())
            await fs.copyFile(join(path, dirent.name), join(newPath, dirent.name))
    }

    // Copy everything in minecraft folder except:
    //   mods, resourcepacks, shaderpacks
    for (let dirent of await readdir(pathMC)) {
        console.log(dirent);
        if (!['mods', 'resourcepacks', 'shaderpacks'].includes(dirent.name))
            await fs.cp(join(pathMC, dirent.name), join(newPathMC, dirent.name));
    }

    console.log('\nDONE\n');
});

ipcMain.handle('importModpack', async () => {
    console.log('Importing modpack');
});

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
        },
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // IPC test
    ipcMain.on('ping', () => console.log('pong'));

    createWindow();

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
