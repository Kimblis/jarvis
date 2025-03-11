# Organization Data Cleaner Testing Suite

This directory contains testing tools and data for the Organization Data Cleaner API.

## Contents

- `organizations-test.csv` - Test CSV file with various data quality issues to test the cleaner
- `test-cleaner.js` - Node.js script to test the data cleaner API
- `organizations-cleaned.json` - Output file that will be generated when running the test

## Test CSV File

The test CSV file includes organizations with various data quality issues:

- **Missing Values**: Empty fields for required data
- **Duplicate Entries**: Multiple rows with the same name/reg code
- **Organization Type Issues**: Incorrect formats, typos, non-standard formats
- **VAT Code Issues**: Country prefixes that need to be removed
- **Address Format Issues**: Incomplete or improperly formatted addresses
- **Country Value Issues**: Countries with incorrect casing or formatting

## Organization Type Standards

The data cleaner handles standardization of organization types following these codes:

| Code | Full Name (Lithuanian)   | Description                    |
| ---- | ------------------------ | ------------------------------ |
| AB   | Akcinė bendrovė          | Public limited company         |
| DB   | Draudimo bendrovė        | Insurance company              |
| F    | Filialas                 | Branch                         |
| IĮ   | Individuali įmonė        | Individual/sole proprietorship |
| PB   | Profesinė bendrija       | Professional partnership       |
| SĮ   | Savivaldybės įmonė       | Municipal enterprise           |
| TŪB  | Tikroji ūkinė bendrija   | General partnership            |
| UAB  | Uždaroji akcinė bendrovė | Private limited company        |
| MB   | Mažoji bendrija          | Small partnership              |
| VĮ   | Valstybės įmonė          | State enterprise               |
| ŽŪB  | Žemės ūkio bendrovė      | Agricultural company           |
| FA   | Fizinis Asmuo            | Natural person                 |

Plus Estonian and Latvian organization types:

| Code | Country | Full Name                          | Description               |
| ---- | ------- | ---------------------------------- | ------------------------- |
| AS   | Estonia | Aktsiaselts                        | Public limited company    |
| OÜ   | Estonia | Osaühing                           | Private limited company   |
| SIA  | Latvia  | Sabiedrība ar ierobežotu atbildību | Limited liability company |

## VAT Code Standardization

VAT codes are standardized by removing country prefixes:

- Lithuanian codes: Remove "LT" prefix
- Estonian codes: Remove "EE" prefix
- Latvian codes: Remove "LV" prefix

## Running the Test

To run the test:

1. Make sure you have Node.js installed
2. Install required dependencies:
   ```
   npm install csv-parser axios
   ```
3. Start your Next.js application:
   ```
   npm run dev
   ```
4. Run the test script:
   ```
   node test-data/test-cleaner.js
   ```

## Test Output

The test script will:

1. Load the test CSV file
2. Send the data to the cleaner API
3. Display analysis results and cleaning actions
4. Show rows that have been flagged for manual review
5. Save cleaned data to an output JSON file

## Integration into your Application

To use this data cleaner in your application, send a POST request to the API endpoint `/api/chat/datacleaner` with a JSON payload containing:

```json
{
  "data": [...], // Array of flat organization objects
  "columns": [...], // Array of column names
  "action": "full" // Optional: "analyze", "plan", "suggest", "execute", or "full"
}
```

The response will include:

- `status`: Success/error status
- `report`: Analysis and cleaning report
- `data`: Cleaned data
- `flaggedRows`: Rows requiring manual review
- `organizations`: Properly structured organization objects
- `datasetInfo`: Information about the dataset size and processing
