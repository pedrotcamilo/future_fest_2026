const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron/main')
const path = require('node:path')

let store = null;
let mainWindow = null;
let configWindow = null;
let tray = null;

async function getStore() {
    if (!store) {
        const { default: Store } = await import('electron-store');
        store = new Store({ name: 'config' });
    }
    return store;
}

function createWindow() {
    const win = mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'assets', 'logo_desktop.png'),
        title: "AxionPhare Desktop",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            partition: "persist:axionphare",
        }
    })

    win.on('page-title-updated', (evento) => {
        evento.preventDefault();
        win.setTitle('AxionPhare Desktop');
    })

    win.loadFile(path.join(__dirname, 'ui', 'index.html'))

    win.webContents.on('did-navigate', (_event, url) => {
        if (/^https?:\/\//i.test(url)) win.maximize();
    })
}

function createConfigWindow() {
    if (configWindow && !configWindow.isDestroyed()) {
        configWindow.focus();
        return configWindow;
    }

    const janela = configWindow = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'assets', 'logo_desktop.png'),
        title: "AxionPhare Desktop",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            partition: "persist:axionphare",
        }
    })

    janela.on('page-title-updated', (evento) => {
        evento.preventDefault();
        janela.setTitle('AxionPhare Desktop');
    })

    janela.loadFile(path.join(__dirname, 'ui', 'config.html'))
    janela.focus()

    janela.on('closed', () => {
        configWindow = null;
    })

    return janela;
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'assets', 'logo_desktop.png'));
    tray.setToolTip('AxionPhare Desktop');
    tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: 'Abrir',
            click: () => {
                if (!mainWindow) return;
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.show();
                mainWindow.focus();
            },
        },
        { label: 'Sair', click: () => app.quit() },
    ]));
}

async function alterarServidor(servidor, porta) {
    const store = await getStore();
    store.set("servidor", servidor);
    store.set("porta", porta);
}

async function obterServidor() {
    const store = await getStore();
    return {
        servidor: store.get("servidor", ""),
        porta: store.get("porta", ""),
    };
}

async function resetarServidor() {
    const store = await getStore();
    store.delete("servidor");
    store.delete("porta");
    return obterServidor();
}

function montarUrlBase(servidor, porta) {
    let base = (servidor ?? "").trim().replace(/\/+$/, "");
    if (!base) return null;
    if (!/^https?:\/\//i.test(base)) base = `http://${base}`;

    const url = new URL(base);
    if (porta && !url.port) url.port = String(porta);
    return url.origin;
}

function montarUrlDiagnostico(servidor, porta) {
    const base = montarUrlBase(servidor, porta);
    return base ? `${base}/diagnosticos/axionphare_desktop` : null;
}

async function validarServidor(servidor, porta) {
    try {
        const url = montarUrlDiagnostico(servidor, porta);
        if (!url) return { valido: false, erro: "Endereço do servidor vazio" };

        const resposta = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!resposta.ok) return { valido: false, erro: `HTTP ${resposta.status}` };

        const dados = await resposta.json();
        const indentidade = dados.indentidade ?? dados.intendidade ?? dados.identidade ?? null;

        if (indentidade === null || !dados.empresa) {
            return { valido: false, erro: "Resposta inesperada do servidor" };
        }

        return { valido: true, url: montarUrlBase(servidor, porta), indentidade, empresa: dados.empresa };
    } catch (erro) {
        return { valido: false, erro: erro.message };
    }
}

ipcMain.handle("config:obter-servidor", () => obterServidor());

ipcMain.handle("config:alterar-servidor", (_event, servidor, porta) => {
    alterarServidor(servidor, porta);
    return obterServidor();
});

ipcMain.handle("config:validar-servidor", (_event, servidor, porta) => validarServidor(servidor, porta));

ipcMain.handle("config:resetar-servidor", () => resetarServidor());

app.on('web-contents-created', (_event, conteudo) => {
    conteudo.on('before-input-event', (evento, entrada) => {
        if (entrada.type !== 'keyDown') return;

        const atalhoConfig = (entrada.control || entrada.meta) && entrada.key === ',';
        if (atalhoConfig) {
            evento.preventDefault();
            createConfigWindow();
        }
    });
})

app.whenReady().then(() => {
    createWindow()
    createTray()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
