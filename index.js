const { app, BrowserWindow, ipcMain, clipboard } = require('electron')
const path = require('path')
const WebSocketServer =require('ws').WebSocketServer;
const myip = require('quick-local-ip');
const devcert = require('devcert');

//getting ip4 network address of local system
console.log(myip.getLocalIP4());

//getting ip6 network address of local system
console.log(myip.getLocalIP6());

ipcMain.handle('getIpResolver', () => {
  return {
    ip4: myip.getLocalIP4()
  };
})

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false
    }
  })
  
  win.loadFile('index.html')
  win.openDevTools();
}

app.whenReady().then(() => {
  createWindow()
  
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

let last = '';

//WS server
const wss = new WebSocketServer({ port: 4000 });

wss.on('connection', function connection(ws) {

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    win.webContents.send('new-clip',data.toString());
  });

  setInterval(() => {
    const clipText = clipboard.readText();
    if (last !== clipText) {
      last = clipText;
      ws.send(last);
      win.webContents.send('new-clip',last);
    }
  }, 1100);
});
