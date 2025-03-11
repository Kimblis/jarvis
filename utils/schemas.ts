import { array, nativeEnum, number, object, string, z } from "zod";

export enum OrganizationIndustry {
  ACCOUNTING = "accounting",
  OTHER = "other",
}

export const COUNTRY_CODES = ["Lithuania", "Estonia", "Latvia"] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

// Validate and clean VAT code based on country
export const vatCodeSchema = z
  .string()
  .nullish()
  .superRefine((val, ctx) => {
    if (!val) return;
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
  type: z.enum([
    "AB",
    "DB",
    "F",
    "IĮ",
    "PB",
    "SĮ",
    "TŪB",
    "UAB",
    "MB",
    "VĮ",
    "ŽŪB",
    "FA",
  ]),
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
  action: z.enum(["fix", "flag", "remove"]).describe("Action to take"),
});

export const analysisSchema = z.object({
  issues: z
    .array(analysisIssueSchema)
    .describe("List of data quality issues found"),
  error: z.string().describe("Error message if there is an error").optional(),
});

export const actionSchema = z.object({
  description: z
    .string()
    .describe("Description of the action, explain what was done"),
  column: z.string().describe("Column that was cleaned"),
});

export const flaggedColumnSchema = z.object({
  column: z.string(),
  reason: z.string().describe("Reason for flagging the column"),
});

export const flaggedRowSchema = z.object({
  rowIndex: z.number().describe("Index of the flagged row"),
  columns: z
    .array(flaggedColumnSchema)
    .describe("Columns flagged for manual review"),
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
  cleaningActionsPerformed: z
    .array(actionSchema)
    .describe("List of cleaning actions performed"),
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
