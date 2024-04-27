const { app, BrowserWindow, ipcMain, Menu, MenuItem } = require("electron");
const moment = require("moment");

const path = require("path");
const fs = require("fs").promises;
const { PDFDocument } = require("pdf-lib");
require("electron-reload")(__dirname);

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Create the context menu
  const contextMenu = new Menu();
  contextMenu.append(new MenuItem({ label: "Copy", role: "copy" }));
  contextMenu.append(new MenuItem({ label: "Paste", role: "paste" }));

  // Attach the context menu to mainWindow
  mainWindow.webContents.on("context-menu", (event, params) => {
    contextMenu.popup(mainWindow, params.x, params.y);
  });

  // Rest of your code...
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
      (daysOfStorageCost || 0);

    const HST = totalCostsToDate * 0.13; // HST rate is 13%, or 0.13

    const totalAmountWithHST = totalCostsToDate + HST;

    const HSTOnly = totalAmountWithHST - totalCostsToDate;

    HSTOnCosts = HSTOnly;
    const amountDueToRedeem = (HSTOnly || 0) + (totalCostsToDate || 0);

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
    form.getTextField("daysOfStorage").setText(daysOfStorage + " days " || "");
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
    form.getTextField("HSTOnCosts").setText(HSTOnCosts.toFixed(2) || ""); // Use HSTOnCosts instead of HSTOnly
    form
      .getTextField("totalCostsToDate")
      .setText(totalCostsToDate ? totalCostsToDate.toString() : "");
    form
      .getTextField("amountDueToRedeem")
      .setText(amountDueToRedeem ? amountDueToRedeem.toString() : "");

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

    // Set closing date based on template type
    if (templatePath.includes("Retain")) {
      const formMoment = moment(formDate ? formDate : "", "YYYY-MM-DD");
      const closingMoment = formMoment.add(45, "days");
      const closingDateString = closingMoment.format("YYYY-MM-DD");
      form
        .getTextField("closingDate")
        .setText(closingDateString ? closingDateString : "");
    } else if (templatePath.includes("Sell")) {
      const formMoment = moment(formDate ? formDate : "", "YYYY-MM-DD");
      const closingMoment = formMoment.add(25, "days");
      const closingDateString = closingMoment.format("YYYY-MM-DD");
      form
        .getTextField("closingDate")
        .setText(closingDateString ? closingDateString : "");
    } else if (templatePath.includes("Lien Only")) {
      const formMoment = moment(formDate ? formDate : "", "YYYY-MM-DD");
      const closingMoment = formMoment.add(25, "days");
      const closingDateString = closingMoment.format("YYYY-MM-DD");
      form
        .getTextField("closingDate")
        .setText(closingDateString ? closingDateString : "");
    }

    // Save the modified PDF document
    const modifiedPdfBytes = await pdfDoc.save();

    // Send the modified PDF bytes back to the renderer process
    event.sender.send("pdf-generated", modifiedPdfBytes);
  }
);

ipcMain.on("upload-files", async (event, { fileData, registeredOwner }) => {
  try {
    const directoryPath = path.join(
      __dirname,
      "files",
      registeredOwner
        ? registeredOwner + " NOI File"
        : "No Registered Owner NOI Files"
    ); // Directory where files will be saved
    await fs.mkdir(directoryPath, { recursive: true }); // Create directory if it doesn't exist

    // Copy uploaded files to the specified directory
    for (const filePath of fileData) {
      const fileName = path.basename(filePath);
      const destination = path.join(directoryPath, fileName);
      await fs.copyFile(filePath, destination);
    }

    // Send confirmation back to the renderer process
    event.sender.send("files-uploaded", "Files uploaded successfully");
  } catch (error) {
    // Handle errors
    console.error("Error uploading files:", error);
    dialog.showErrorBox("Error", "Failed to upload files. Please try again.");
  }
});
