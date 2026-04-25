import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path, { join } from 'path'
import { fileURLToPath } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { homedir } from 'os'
import fs from 'fs/promises'
import AdmZip from 'adm-zip'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

let instancePath = join(homedir(), 'AppData/Roaming/PrismLauncher/instances')
let downloadsPath = join(homedir(), 'Downloads')

async function readdir(path) {
    return await fs.readdir(path, { withFileTypes: true })
}

function getTOMLObject(text) {
    let obj = {};

    for (let line of text.split('\n')) {
        key = line.substring(0, line.indexOf('=')).trim();
        value = eval(line.substring(line.indexOf('=') + 1).trim());

        obj[key] = value;
    }

    return obj;
}

async function download(url, path) {
    const file = await fetch(url)
    const buffer = await file.arrayBuffer()
    await fs.writeFile(path, Buffer.from(buffer))
}

ipcMain.handle('openPath', (event, path) => {
    shell.openPath(path)
})

ipcMain.handle('getInstances', async () => {
    try {
        let folders = await readdir(instancePath)

        return folders
            .filter(e => e.isDirectory() && !e.name.startsWith('.'))
            .map(e => e.name)
    } catch (error) {
        return false
    }
})

ipcMain.handle('exportModpack', async (event, name) => {
    // Remember the paths needed for exporting
    let path = join(instancePath, name)
    let pathMC = join(path, 'minecraft')
    let newPath = join(instancePath, name + '_EXPORT')
    let newPathMC = join(newPath, 'minecraft')
    let zipPath = join(downloadsPath, name + '.zip')

    // Open new window to show export details
    const win = new BrowserWindow({
        width: 600,
        height: 250,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
        },
    })

    win.on('ready-to-show', win.show)

    const query = {
        name,
        path: zipPath,
    }

    await win.loadFile(join(__dirname, '../renderer/export.html'), { query })

    await fs.mkdir(newPathMC, { recursive: true })

    // Copy root files
    for (let dirent of await readdir(path))
        if (dirent.isFile())
            await fs.copyFile(join(path, dirent.name), join(newPath, dirent.name))

    win.webContents.send('export-progress', 1 / 7)

    // Copy all files and selected folders from the minecraft folder
    for (let dirent of await readdir(pathMC))
        if (dirent.isFile() || [
            'config',
            'data',
        ].includes(dirent.name))
            await fs.cp(
                join(pathMC, dirent.name),
                join(newPathMC, dirent.name),
                { recursive: true })

    win.webContents.send('export-progress', 2 / 7)

    // Copy .index from mods and resourcepacks
    await fs.cp(
        join(pathMC, 'mods/.index'),
        join(newPathMC, 'mods/.index'),
        { recursive: true }
    ).catch(() => {})

    win.webContents.send('export-progress', 3 / 7)

    await fs.cp(
        join(pathMC, 'resourcepacks/.index'),
        join(newPathMC, 'resourcepacks/.index'),
        { recursive: true }
    ).catch(() => {})

    win.webContents.send('export-progress', 4 / 7)

    // Copy .toml files from shaderpacks
    await fs.mkdir(join(newPathMC, 'shaderpacks'), { recursive: true })

    for (let dirent of await readdir(join(pathMC, 'shaderpacks')))
        if (dirent.isFile() && dirent.name.endsWith('.toml'))
            await fs.copyFile(
                join(pathMC, 'shaderpacks', dirent.name),
                join(newPathMC, 'shaderpacks', dirent.name))

    win.webContents.send('export-progress', 5 / 7)

    // Zip modpack
    let zip = new AdmZip()
    zip.addLocalFolder(newPath)
    zip.writeZip(zipPath)

    win.webContents.send('export-progress', 6 / 7)

    // Delete temporary folder
    await fs.rm(newPath, { recursive: true })

    win.webContents.send('export-progress', 7 / 7)

    console.log('Exported to:', zipPath)
})

ipcMain.handle('importModpack', async () => {
    console.log('Importing modpack...')

    const result = await dialog.showOpenDialog({
        defaultPath: downloadsPath,
        properties: ['openFile'],
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
    })

    if (result.canceled)
        return false

    let zipPath = result.filePaths[0]
    let name = zipPath.split(/\/|\\/).pop().split('.')[0]
    let newPath = join(instancePath, name)

    // Check if dir exists
    if (existsSync(newPath)) {
        // Count highest numeral
        let numeral = 1

        while (existsSync(newPath + '_' + numeral))
            ++numeral

        newPath += '_' + numeral
    }

    // Make new dir
    await fs.mkdir(newPath, { recursive: true })

    // Extract to this folder
    let zip = new AdmZip(zipPath)
    zip.extractAllTo(newPath, true)

    let newPathMC = join(newPath, 'minecraft')

    // Download mods
    for (let dirent of await readdir(join(newPathMC, 'mods/.index'))) {
        let filePath = join(newPathMC, 'mods/.index', dirent.name)

        if (dirent.name.endsWith('.toml')) {
            let downloadLink = getDownloadFromTOML(await fs.readFile(filePath, 'utf-8'))
            if (downloadLink)
                await download(downloadLink, join(newPathMC, 'mods'))
        }
    }

    // Download resourcepacks

    // Download shaderpacks

    console.log('Imported modpack from:', zipPath)
    return `Successfully imported ${zipPath}`
})

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
    ipcMain.on('ping', () => console.log('pong'))

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow()
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
