# CSV Data Cleaner with AI-Powered Features

A powerful tool that uses AI to clean, normalize, and validate CSV data according to specific schemas like organization data.

## Features

- **AI-Powered Data Analysis**: Automatically detects issues in your CSV data including missing values, duplicates, outliers, and formatting inconsistencies.
- **Smart Cleaning Plan**: Creates a step-by-step cleaning plan tailored to your specific data issues.
- **Guided Cleaning Actions**: Suggests specific actions to clean your data based on detected issues.
- **Schema Validation**: Validates and normalizes data according to predefined schemas (e.g., organization data).
- **Workflow-Based Processing**: Uses a state-based workflow to process data methodically through analysis, planning, action suggestion, and execution.
- **Interactive UI**: User-friendly interface to upload, view, and clean your data.

## Organization Schema Support

This tool supports cleaning and validating organization data according to the following schema:

```typescript
export const organizationSchema = object({
  name: string(),
  industry: nativeEnum(OrganizationIndustry), // "accounting" or "other"
  regCode: string(),
  vatCode: string().nullish(),
  country: string(),
  type: string(),
  address: object({
    firstLine: string(),
    city: string(),
    postalCode: string(),
  }),
});
```

## How It Works

1. **Upload your CSV or Excel file**: The tool supports both formats and parses them automatically.
2. **AI Analysis**: The system analyzes your data to identify quality issues.
3. **Cleaning Plan**: Based on the analysis, a step-by-step cleaning plan is created.
4. **Suggested Actions**: For each step in the plan, specific cleaning actions are suggested.
5. **Execution**: The system executes the cleaning actions and provides a summary of changes.
6. **Download**: Download your cleaned data in the format of your choice.

## Setup and Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/csv-data-cleaner.git
cd csv-data-cleaner
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` to add your OpenAI API key:

```
OPENAI_API_KEY=your_api_key_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Usage

The data cleaner exposes an API endpoint at `/api/chat/datacleaner` that you can use programmatically:

```javascript
// Example POST request to analyze data
const response = await fetch("/api/chat/datacleaner", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    data: yourData, // Array of objects representing your CSV data
    columns: columnNames, // Array of column names
    action: "analyze", // Optional: 'analyze', 'plan', 'suggest', 'execute'
  }),
});

const result = await response.json();
// result contains analysis, cleaning plan, or cleaned data depending on the action
```

## Test Data

The repository includes several test CSV files in the `test-data` directory:

- `organizations.csv`: Sample organization data with various issues to test cleaning
- `customer_data.csv`: Customer data with missing values, outliers, and duplicates
- `product_sales.csv`: Product sales data with inconsistent formatting and other issues

## Running Tests

The project uses Jest for testing. To run the tests:

```bash
npm test
```

For watching mode during development:

```bash
npm run test:watch
```

For test coverage report:

```bash
npm run test:coverage
```

### Test Files

- `__tests__/basic/csv-parser.test.ts`: Basic tests for CSV parsing functionality
- `__tests__/route-handlers/datacleaner.test.ts`: Tests for the data cleaner API

### Test Data

Test CSV files are located in the `test-data` directory:

- `organizations.csv`: Organization data with schema validation
- `customer_data.csv`: Customer data with common data quality issues
- `product_sales.csv`: Product sales data with formatting inconsistencies

## Technology Stack

- Next.js
- React
- TypeScript
- Zod (for schema validation)
- LangGraph (for workflow orchestration)
- OpenAI GPT-4 (for AI analysis and suggestions)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
