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
      bailiffCosts,
      towingCost,
      storageCosts,
      NOICosts,
      HSTOnCosts,
      closingDate,
      formDate,
      totalOfStorageRate,
      dateOfAdditionalCharges,
      repoDate,
      dateNOISent,
      staffAffidavitName,
      registeredOwnerCont,
      Affidavit_Date1,
      Affidavit_Date2,
    }
  ) => {
    // Convert input values to numbers
    const daysOfStorageNum = parseFloat(daysOfStorage);
    const storageRateNum = parseFloat(storageRate);
    const amountOfArrearsNum = parseFloat(amountOfArrears);
    const bailiffCostsNum = parseFloat(bailiffCosts);
    const towingCostNum = parseFloat(towingCost);
    const storageCostsNum = parseFloat(storageCosts);
    const NOICostsNum = parseFloat(NOICosts);
    let HSTOnCostsNum = parseFloat(HSTOnCosts);

    // Calculate derived fields only if input values are not empty
    const daysOfStorageCost =
      !isNaN(daysOfStorageNum) && !isNaN(storageRateNum)
        ? daysOfStorageNum * storageRateNum
        : null;
    const totalCostsToDate =
      (amountOfArrearsNum || 0) +
      (bailiffCostsNum || 0) +
      (towingCostNum || 0) +
      (storageCostsNum || 0) +
      (NOICostsNum || 0) +
      (HSTOnCostsNum || 0);
    const amountDueToRedeem =
      (amountOfArrearsNum || 0) +
      (daysOfStorageCost || 0) +
      (bailiffCostsNum || 0) +
      (NOICostsNum || 0) +
      (HSTOnCostsNum || 0);

    // Read the template PDF file
    const pdfBytes = await fs.readFile(
      path.join(__dirname, "../templates", templatePath)
    );

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Set values for all text fields
    form.getTextField("client").setText(clientName || "");
    form.getTextField("assetDescription").setText(assetDescription || "");
    form.getTextField("VIN/serialNum").setText(VIN_serialNum || "");
    form.getTextField("licensePlate").setText(licensePlate || "");
    form.getTextField("registeredOwner").setText(registeredOwner || "");
    form.getTextField("lienHolder").setText(lienHolder || "");
    form.getTextField("daysOfStorage").setText(daysOfStorage || "");
    form.getTextField("storageRate").setText(storageRate || "");
    form.getTextField("amountOfArrears").setText(amountOfArrears || "");
    form
      .getTextField("daysOfStorageCost")
      .setText(daysOfStorageCost ? daysOfStorageCost.toString() : "");
    form.getTextField("bailiffCosts").setText(bailiffCosts || "");
    form.getTextField("totalOfStorageRate").setText(totalOfStorageRate || "");
    form.getTextField("towingCost").setText(towingCost || "");
    form.getTextField("storageCosts").setText(storageCosts || "");
    form.getTextField("NOICosts").setText(NOICosts || "");
    form.getTextField("HSTOnCosts").setText(HSTOnCosts || "");
    form
      .getTextField("totalCostsToDate")
      .setText(totalCostsToDate ? totalCostsToDate.toString() : "");
    form
      .getTextField("amountDueToRedeem")
      .setText(amountDueToRedeem ? amountDueToRedeem.toString() : "");
    form.getTextField("closingDate").setText(closingDate || "");
    form.getTextField("formDate").setText(formDate || "");
    form
      .getTextField("dateOfAdditionalCharges")
      .setText(dateOfAdditionalCharges || "");
    form.getTextField("repoDate").setText(repoDate || "");
    form.getTextField("dateNOISent").setText(dateNOISent || "");
    form.getTextField("staffAffidavitName").setText(staffAffidavitName || "");
    form.getTextField("registeredOwnerCont").setText(registeredOwnerCont || "");
    form.getTextField("Affidavit_Date1").setText(Affidavit_Date1 || "");
    form.getTextField("Affidavit_Date2").setText(Affidavit_Date2 || "");

    // Save the modified PDF document
    const modifiedPdfBytes = await pdfDoc.save();

    // Send the modified PDF bytes back to the renderer process
    event.sender.send("pdf-generated", modifiedPdfBytes);
  }
);
