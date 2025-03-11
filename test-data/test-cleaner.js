const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const axios = require("axios");

// Path to the test CSV file
const csvFilePath = path.join(__dirname, "organizations-test.csv");

// API endpoint for the data cleaner
const apiUrl = "http://localhost:3000/api/chat/datacleaner";

// Function to read CSV file into an array of objects
async function readCSV(filePath) {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

// Function to call the data cleaner API
async function cleanData(data, columns) {
  try {
    const response = await axios.post(apiUrl, {
      data,
      columns,
      action: "full",
    });

    return response.data;
  } catch (error) {
    console.error("Error calling data cleaner API:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
}

// Main function to run the test
async function runTest() {
  try {
    console.log("Reading test CSV file...");
    const data = await readCSV(csvFilePath);
    const columns = Object.keys(data[0]);

    console.log(
      `CSV loaded with ${data.length} rows and ${columns.length} columns:`,
    );
    console.log("Columns:", columns);
    console.log("First row sample:", data[0]);

    console.log("\nCalling data cleaner API...");
    const result = await cleanData(data, columns);

    console.log("\nData cleaning completed!");
    console.log("Status:", result.status);

    if (result.report) {
      console.log("\n--- Analysis Report ---");
      console.log(result.report.analysis.summary);

      console.log("\n--- Issues Found ---");
      result.report.analysis.issues.forEach((issue, i) => {
        console.log(`Issue ${i + 1}: ${issue.type} (${issue.severity})`);
        console.log(`Description: ${issue.description}`);
        if (issue.affectedColumns)
          console.log(`Affected columns: ${issue.affectedColumns.join(", ")}`);
        if (issue.rowCount) console.log(`Rows affected: ${issue.rowCount}`);
        console.log("---");
      });

      console.log("\n--- Cleaning Actions Performed ---");
      result.report.actionsPerformed.forEach((action, i) => {
        console.log(`${i + 1}. ${action}`);
      });

      console.log("\n--- Cleaning Summary ---");
      console.log(result.report.summary);
    }

    if (result.flaggedRows && result.flaggedRows.length > 0) {
      console.log("\n--- Rows Flagged for Manual Review ---");
      result.flaggedRows.forEach((row, i) => {
        console.log(
          `Flagged Row ${i + 1} (index ${row.rowIndex}): ${row.reason}`,
        );
        console.log(`Columns with issues: ${row.columns.join(", ")}`);
        console.log("---");
      });
    }

    if (result.organizations) {
      console.log("\n--- Successfully Converted Organizations ---");
      console.log(`Total: ${result.organizations.length} organizations`);
      console.log("Example organization:", result.organizations[0]);
    }

    if (result.conversionError) {
      console.log("\n--- Conversion Error ---");
      console.log(result.conversionError);
    }

    console.log("\n--- Dataset Info ---");
    if (result.datasetInfo) {
      console.log(`Row count: ${result.datasetInfo.rowCount}`);
      console.log(`Size: ${result.datasetInfo.sizeInMB} MB`);
      console.log(`Estimated tokens: ${result.datasetInfo.estimatedTokens}`);
      console.log(`Note: ${result.datasetInfo.processingNote}`);
    }

    // Save cleaned data to a new CSV file
    if (result.organizations) {
      const cleanedPath = path.join(__dirname, "organizations-cleaned.json");
      fs.writeFileSync(
        cleanedPath,
        JSON.stringify(result.organizations, null, 2),
      );
      console.log(`\nCleaned data saved to: ${cleanedPath}`);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
runTest();
