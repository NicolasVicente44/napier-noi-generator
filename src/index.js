const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const { PDFDocument } = require("pdf-lib");

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, "index.html"));

};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on(
  "generate-pdf",
  async (
    event,
    {
      templatePath,
      clientName,
      assetDescription,
      VIN_serialNum,
      licensePlate,
      registeredOwner,
      lienHolder,
      daysOfStorage,
      storageRate,
      amountOfArrears,
      daysOfStorageCost,
      bailiffCosts,
      totalOfStorageRate,
      towingCost,
      storageCosts,
      NOICosts,
      HSTOnCosts,
      totalCostsToDate,
      amountDueToRedeem,
      closingDate,
      formDate,
      dateOfAdditionalCharges,
      repoDate,
      dateNOISent,
      staffAffidavitName,
      registeredOwnerCont,
      Affidavit_Date1,
      Affidavit_Date2,
    }
  ) => {
    const pdfBytes = await fs.readFile(
      path.join(__dirname, "../templates", templatePath)
    );

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Set values for all text fields
    form.getTextField("client").setText(clientName);
    form.getTextField("assetDescription").setText(assetDescription);
    form.getTextField("VIN/serialNum").setText(VIN_serialNum);
    form.getTextField("licensePlate").setText(licensePlate);
    form.getTextField("registeredOwner").setText(registeredOwner);
    form.getTextField("lienHolder").setText(lienHolder);
    form.getTextField("daysOfStorage").setText(daysOfStorage);
    form.getTextField("storageRate").setText(storageRate);
    form.getTextField("amountOfArrears").setText(amountOfArrears);
    form.getTextField("daysOfStorageCost").setText(daysOfStorageCost);
    form.getTextField("bailiffCosts").setText(bailiffCosts);
    form.getTextField("totalOfStorageRate").setText(totalOfStorageRate);
    form.getTextField("towingCost").setText(towingCost);
    form.getTextField("storageCosts").setText(storageCosts);
    form.getTextField("NOICosts").setText(NOICosts);
    form.getTextField("HSTOnCosts").setText(HSTOnCosts);
    form.getTextField("totalCostsToDate").setText(totalCostsToDate);
    form.getTextField("amountDueToRedeem").setText(amountDueToRedeem);
    form.getTextField("closingDate").setText(closingDate);
    form.getTextField("formDate").setText(formDate);
    form
      .getTextField("dateOfAdditionalCharges")
      .setText(dateOfAdditionalCharges);
    form.getTextField("repoDate").setText(repoDate);
    form.getTextField("dateNOISent").setText(dateNOISent);
    form.getTextField("staffAffidavitName").setText(staffAffidavitName);
    form.getTextField("registeredOwnerCont").setText(registeredOwnerCont);
    form.getTextField("Affidavit_Date1").setText(Affidavit_Date1);
    form.getTextField("Affidavit_Date2").setText(Affidavit_Date2);

    const modifiedPdfBytes = await pdfDoc.save();

    event.sender.send("pdf-generated", modifiedPdfBytes);
  }
);
