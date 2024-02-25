const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('generate-pdf', async (event, { templatePath, clientName }) => {
    const pdfBytes = await fs.readFile(path.join(__dirname, '../templates', templatePath));

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const textField = form.getTextField('client');
    textField.setText(clientName);

    const modifiedPdfBytes = await pdfDoc.save();

    event.sender.send('pdf-generated', modifiedPdfBytes);
});
