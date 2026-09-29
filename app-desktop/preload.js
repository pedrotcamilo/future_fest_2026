const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apiConfig', {
    obterServidor: () => ipcRenderer.invoke('config:obter-servidor'),
    alterarServidor: (servidor, porta) => ipcRenderer.invoke('config:alterar-servidor', servidor, porta),
    validarServidor: (servidor, porta) => ipcRenderer.invoke('config:validar-servidor', servidor, porta),
    resetarServidor: () => ipcRenderer.invoke('config:resetar-servidor'),
});
