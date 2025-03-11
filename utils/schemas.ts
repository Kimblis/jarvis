import { array, nativeEnum, number, object, string, z } from "zod";

export enum OrganizationIndustry {
  ACCOUNTING = "accounting",
  OTHER = "other",
}

export enum OrganizationType {
  AB = "AB", // Akcinė bendrovė
  DB = "DB", // Draudimo bendrovė
  F = "F", // Filialas
  IĮ = "IĮ", // Individuali įmonė
  PB = "PB", // Profesinė bendrija
  SĮ = "SĮ", // Savivaldybės įmonė
  TŪB = "TŪB", // Tikroji ūkinė bendrija
  UAB = "UAB", // Uždaroji akcinė bendrovė
  MB = "MB", // Mažoji bendrija
  VĮ = "VĮ", // Valstybės įmonė
  ŽŪB = "ŽŪB", // Žemės ūkio bendrovė
  FA = "FA", // Fizinis Asmuo

  // Estonian company types
  AS = "AS", // Aktsiaselts
  OÜ = "OÜ", // Osaühing

  // Latvian company types
  SIA = "SIA", // Sabiedrība ar ierobežotu atbildību
}

export const COUNTRY_CODES = ["Lithuania", "Estonia", "Latvia"] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

// Validate and clean VAT code based on country
export const vatCodeSchema = z
  .string()
  .nullish()
  .superRefine((val, ctx) => {
    if (!val) return;

    // For now we're just validating that the VAT code exists
    // Additional validation based on country could be added later
  })
  .transform((val, ctx) => {
    if (!val) return null;

    // Remove country prefix if present
    if (val.startsWith("LT")) {
      return val.substring(2);
    } else if (val.startsWith("EE")) {
      return val.substring(2);
    } else if (val.startsWith("LV")) {
      return val.substring(2);
    }

    return val;
  });

// Transform organization type to standardized format
export const organizationTypeSchema = z.string().transform((val, ctx) => {
  if (!val) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Organization type is required",
    });
    return undefined;
  }

  // Normalize value - remove accents, lowercase, trim
  const normalizedVal = val
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Handle full names with abbreviations
  if (normalizedVal.startsWith("ab - ") || normalizedVal === "akcine bendrove")
    return OrganizationType.AB;
  if (
    normalizedVal.startsWith("db - ") ||
    normalizedVal === "draudimo bendrove"
  )
    return OrganizationType.DB;
  if (normalizedVal.startsWith("f - ") || normalizedVal === "filialas")
    return OrganizationType.F;
  if (
    normalizedVal.startsWith("įį - ") ||
    normalizedVal.startsWith("ii - ") ||
    normalizedVal === "individuali imone"
  )
    return OrganizationType.IĮ;
  if (
    normalizedVal.startsWith("pb - ") ||
    normalizedVal === "profesine bendrija"
  )
    return OrganizationType.PB;
  if (
    normalizedVal.startsWith("sį - ") ||
    normalizedVal.startsWith("si - ") ||
    normalizedVal === "savivaldybes imone"
  )
    return OrganizationType.SĮ;
  if (
    normalizedVal.startsWith("tūb - ") ||
    normalizedVal.startsWith("tub - ") ||
    normalizedVal === "tikroji ukine bendrija"
  )
    return OrganizationType.TŪB;
  if (
    normalizedVal.startsWith("uab - ") ||
    normalizedVal === "uzdaroji akcine bendrove"
  )
    return OrganizationType.UAB;
  if (normalizedVal.startsWith("mb - ") || normalizedVal === "mazoji bendrija")
    return OrganizationType.MB;
  if (
    normalizedVal.startsWith("vį - ") ||
    normalizedVal.startsWith("vi - ") ||
    normalizedVal === "valstybes imone"
  )
    return OrganizationType.VĮ;
  if (
    normalizedVal.startsWith("žūb - ") ||
    normalizedVal.startsWith("zub - ") ||
    normalizedVal === "zemes ukio bendrove"
  )
    return OrganizationType.ŽŪB;
  if (normalizedVal.startsWith("fa - ") || normalizedVal === "fizinis asmuo")
    return OrganizationType.FA;

  // Handle Estonian company types
  if (normalizedVal === "as" || normalizedVal === "aktsiaselts")
    return OrganizationType.AS;
  if (
    normalizedVal === "ou" ||
    normalizedVal === "osaühing" ||
    normalizedVal === "osuhing"
  )
    return OrganizationType.OÜ;

  // Handle Latvian company types
  if (
    normalizedVal === "sia" ||
    normalizedVal === "sabiedrība ar ierobežotu atbildību"
  )
    return OrganizationType.SIA;

  // Handle exact matches for abbreviations
  for (const type of Object.values(OrganizationType)) {
    if (normalizedVal === type.toLowerCase()) return type;
  }

  // If we can't determine the type, return the original value
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: `Unknown organization type: ${val}`,
  });
  return val;
});

export const validationError = object({
  organizationIndex: number(),
  issues: array(
    object({})
      .catchall(z.union([z.string(), z.number()]))
      .describe("Validation error"),
  ),
});

export const organizationSchema = object({
  index: number(),
  name: string(),
  industry: nativeEnum(OrganizationIndustry),
  regCode: string(),
  vatCode: vatCodeSchema,
  country: z.enum(COUNTRY_CODES),
  type: organizationTypeSchema,
  firstLine: string(),
  city: string(),
  postalCode: string(),
});

export const looseOrganizationSchema = object({
  index: number(),
  name: string().nullish(),
  industry: string().nullish(),
  regCode: string().nullish(),
  vatCode: string().nullish(),
  country: string().nullish(),
  type: string().nullish(),
  firstLine: string().nullish(),
  city: string().nullish(),
  postalCode: string().nullish(),
});

export const organizationsSchema = array(organizationSchema);

export const analysisIssueSchema = z.object({
  type: z.string().describe("Type of data quality issue"),
  description: z.string().describe("Detailed description of the issue"),
  affectedRowIndexes: z
    .array(z.number())
    .optional()
    .describe("Indexes of rows affected by this issue"),
  column: z.string().describe("Column affected by this issue"),
  severity: z.enum(["low", "medium", "high"]).describe("Severity of the issue"),
});

export const analysisSchema = z.object({
  issues: z
    .array(analysisIssueSchema)
    .describe("List of data quality issues found"),
  summary: z.string().describe("Overall summary of the data quality"),
});

export const actionSchema = z.object({
  type: z
    .enum([
      "remove_duplicates",
      "handle_nulls",
      "handle_outliers",
      "normalize",
      "categorical_encoding",
      "flag_for_change",
    ])
    .describe("Type of cleaning action"),
  description: z
    .string()
    .describe("Description of the action, explain fully what needs to be done"),
  column: z.string().describe("Column that needs to be cleaned"),
});

export const flaggedColumnSchema = z.object({
  column: z.string().describe("Column that needs to be manually cleaned"),
  reason: z.string().describe("Reason for flagging the column"),
});

export const flaggedRowSchema = z.object({
  rowIndex: z.number().describe("Index of the flagged row"),
  columns: z
    .array(flaggedColumnSchema)
    .describe("Columns affected by the issue"),
});

export const cleanOrganizationSchema = z.object({
  cleanedOrganization: looseOrganizationSchema,
  actionsPerformed: z.array(actionSchema).describe("List of actions performed"),
  flaggedColumns: z
    .array(flaggedColumnSchema)
    .describe("List of columns that need to be manually cleaned"),
});

export const cleanDataSchema = z.object({
  cleanedData: array(looseOrganizationSchema),
  actionsPerformed: z.array(actionSchema).describe("List of actions performed"),
  flaggedRows: z.array(flaggedRowSchema).describe("List of flagged rows"),
});

export const summarySchema = z.object({
  summary: z.string().describe("Summary of the cleaning results"),
  recommendations: z
    .array(z.string())
    .describe("Recommendations for any remaining issues"),
});

export type Organization = z.infer<typeof organizationSchema>;
export type Organizations = z.infer<typeof organizationsSchema>;
export type AnalysisIssue = z.infer<typeof analysisIssueSchema>;
export type Analysis = z.infer<typeof analysisSchema>;
export type Action = z.infer<typeof actionSchema>;
export type CleanDataSchema = z.infer<typeof cleanDataSchema>;
export type Summary = z.infer<typeof summarySchema>;
export type FlaggedRow = z.infer<typeof flaggedRowSchema>;
export type ValidationError = z.infer<typeof validationError>;
export type CleanOrganizationSchema = z.infer<typeof cleanOrganizationSchema>;
export type LooseOrganization = z.infer<typeof looseOrganizationSchema>;
