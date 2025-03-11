import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

describe("CSV Parser", () => {
  it("should parse the organization CSV file correctly", () => {
    // Read the test data
    const csvFilePath = path.join(
      process.cwd(),
      "test-data",
      "organizations.csv",
    );
    const fileContent = fs.readFileSync(csvFilePath, "utf8");
    const data = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Basic validation
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Check fields
    const firstRow = data[0];
    expect(firstRow).toHaveProperty("name");
    expect(firstRow).toHaveProperty("industry");
    expect(firstRow).toHaveProperty("regCode");
    expect(firstRow).toHaveProperty("country");
    expect(firstRow).toHaveProperty("type");
    expect(firstRow["address.firstLine"]).toBeDefined();
    expect(firstRow["address.city"]).toBeDefined();
    expect(firstRow["address.postalCode"]).toBeDefined();

    // Check for specific data
    const acmeAccounting = data.find(
      (org: any) => org.name === "Acme Accounting",
    );
    expect(acmeAccounting).toBeDefined();
    expect(acmeAccounting.industry).toBe("accounting");
    expect(acmeAccounting.regCode).toBe("REG12345");
  });

  it("should parse the customer data CSV file correctly", () => {
    // Read the test data
    const csvFilePath = path.join(
      process.cwd(),
      "test-data",
      "customer_data.csv",
    );
    const fileContent = fs.readFileSync(csvFilePath, "utf8");
    const data = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Basic validation
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Check fields
    const firstRow = data[0];
    expect(firstRow).toHaveProperty("ID");
    expect(firstRow).toHaveProperty("Name");
    expect(firstRow).toHaveProperty("Age");
    expect(firstRow).toHaveProperty("Income");
    expect(firstRow).toHaveProperty("Email");

    // Check for specific data
    const johnSmith = data.find(
      (customer: any) => customer.Name === "John Smith",
    );
    expect(johnSmith).toBeDefined();
    expect(johnSmith.Age).toBe("34");
    expect(johnSmith.Email).toBe("john.smith@example.com");
  });

  it("should parse the product sales CSV file correctly", () => {
    // Read the test data
    const csvFilePath = path.join(
      process.cwd(),
      "test-data",
      "product_sales.csv",
    );
    const fileContent = fs.readFileSync(csvFilePath, "utf8");
    const data = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    });

    // Basic validation
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Check fields
    const firstRow = data[0];
    expect(firstRow).toHaveProperty("Product_ID");
    expect(firstRow).toHaveProperty("Product_Name");
    expect(firstRow).toHaveProperty("Category");
    expect(firstRow).toHaveProperty("Price");
    expect(firstRow).toHaveProperty("Quantity_Sold");

    // Check for specific data
    const laptop = data.find(
      (product: any) => product.Product_Name === "Laptop Pro X",
    );
    expect(laptop).toBeDefined();
    expect(laptop.Category).toBe("Electronics");
  });
});
