import { string, z } from "zod";

export interface InteractionResult {
  events: any[];
  progress: number;
  tags: any[];
  status: string;
  scoring: {
    finished: boolean;
    marksEarned: number;
    marksTotal: number;
    penalties: {
      marksPenalty: number;
      hintsRequested: number;
      mathErrors: number;
      notationErrors: number;
    };
  };
}

export interface Item {
  id?: string;
  itemType: string;
  content: string;
  interactionType?: string;
  solution?: string;
  result?: InteractionResult;
}

export interface Element {
  id: string;
  type: string;
  items: Item[];
}

export interface ResponseData {
  success: boolean;
  elements: Element[];
  tagDescriptions: Record<string, any>;
}

export type AlgebraKitSession = {
  success: boolean;
  sessionId: string;
  html: string;
  type?: string;
  solution?: boolean;
  interactions?: object;
};

interface Expression {
  mimeType: string;
  content: string;
  akit?: string;
}

interface DerivationStep {
  type: string;
  orgContent?: Expression[];
  highlightedOrgContent?: Expression[];
  heading?: Expression[];
  content?: Expression[];
  highlightedContent?: Expression[];
}

interface Derivation {
  type: string;
  orgContent: Expression[];
  content: Expression[];
  highlightedContent?: any;
  explanation: DerivationStep[];
}

interface Ans {
  id: string;
  type: string;
  hasHint: boolean;
  startExpression: Expression[];
}

interface Interaction {
  id: string;
  ans: Ans;
  palette: string;
  variables: string[];
  inline: boolean;
  showHints: boolean;
  hintAvailable: boolean;
  derivation: Derivation;
  widgetType: string;
  i18n: string[];
  numeralSystem: string;
  extendedInline: boolean;
  interactionOptions: any;
  enableCalculator: boolean;
  scored: boolean;
  marksTotal: number;
}

export interface SolutionElement {
  id: string;
  type: string;
  instructionType: string;
  content: Expression[];
  interactions: Interaction[];
  resources: any[];
}

interface View {
  i18n: string[];
  showHints: boolean;
  numeralSystem: string;
  elements: SolutionElement[];
  assessmentMode: boolean;
  questionMode: string;
}

interface Data {
  view: View;
  attributes: any;
  solution: boolean;
}

export interface SolutionResponse {
  html: string;
  data: Data;
  sessionId: string;
  appId: string;
  type: string;
  solution: boolean;
  success: boolean;
  tagDescriptions: any;
}

export interface SessionInfoElement {
  id: string;
  type: string;
  items: SessionInfoItem[];
}

export interface SessionInfoItem {
  id?: string;
  itemType: string;
  content: string;
  interactionType?: string;
  solution?: string;
  result?: InteractionResult;
}

export interface SessionInfoResponse {
  success: boolean;
  tagDescriptions: any;
  elements: SessionInfoElement[];
}

export type ExerciseResponse = {
  text: string;
  solutionText: string;
  solutionSkills: string[];
  condition: string;
  topic: string;
  template: string;
  assets: Record<string, string>;
};

export type AnsweredSessionResponse = {
  condition: string;
  studentSolution: string;
  studentAnswer: string;
  scoresTotal: number;
  scoresEarned: number;
  correctAnswer: string;
};

export enum AlgebraExerciseState {
  DRAFT = "DRAFT",
  APPROVED = "APPROVED",
}

export type AlgebraKitMetadata = {
  id: string;
  name: string;
  value: string;
};

export type AlgebraKitSubjectsResponse = {
  id: string;
  name: string;
  metadata: AlgebraKitMetadata[];
  children: AlgebraKitChildren[];
};

export type AlgebraKitChildren = {
  id: string;
  name: string;
  type: AlgebraChildrenType;
  metadata: AlgebraKitMetadata[];
  state?: AlgebraExerciseState;
};

export enum AlgebraChildrenType {
  FOLDER = "FOLDER",
  EXERCISE = "EXERCISE",
}

export enum ExerciseType {
  MULTISTEP = "MULTISTEP",
  FILL_IN_THE_BLANKS = "FILL_IN_THE_BLANKS",
  MATH_TABLE = "MATH_TABLE",
  MODEL_METHOD = "MODEL_METHOD",
  ARITHMETIC = "ARITHMETIC",
  OPEN_ANSWER = "OPEN_ANSWER",
  CHOICE = "CHOICE",
  STATISTICS = "STATISTICS",
  GEOMETRY = "GEOMETRY",
  NUMBER_LINE = "NUMBER_LINE",
  ALGEBRA = "ALGEBRA",
  INLINE = "INLINE",
}

export enum ExerciseDifficulty {
  NONE = "None",
  THRESHOLD = "Threshold",
  SATISFACTORY = "Satisfactory",
  FUNDAMENTAL = "Fundamental",
  HONORABLE = "Honorable",
}

export type AlgebraKitPubVersionInfo = {
  name: string;
  majorVersion: number | "latest";
  minorVersion: number;
  interactions: AlgebraKitInteractionInfo[];
};

export type AlgebraKitInteractionInfo = {
  block: string;
  refId: string;
  type: ExerciseType;
  refName: string;
};

export const exerciseResponseSchema = z.object({
  condition: z
    .string()
    .describe(
      "The original condition of the exercise with any extraneous tags, styles, or non-essential content removed",
    ),
  topic: z
    .string()
    .describe(
      "The main mathematical topic (e.g., linear equations, geometry, vectors)",
    ),
  template: z
    .string()
    .describe(
      `A general form of the exercise with placeholders for variable parts. For instance, if an exercise is "Išspręsk lygtį: $2x - 2 = 14 - 4x$", a possible template might be "Solve the equation: {{ax}} - {{b}} = {{c}} - {{dx}}`,
    ),
  assets: z
    .object({})
    .catchall(z.enum(["image", "video"]))
    .describe(
      `A key-value mapping of assets found in the exercise. The key should be the URL of an image/video and the value should denote the asset type ("image" or "video")`,
    ),
  mathjson: z
    .object({})
    .catchall(z.string())
    .describe(`Condition in MathJSON format.`),
  answers: z.array(string()),
});

export const sessionInfoResponseSchema = z.object({
  condition: z.string().describe("A full, original exercise condition"),
  studentSolution: z.string().describe("A full student solution solution"),
  studentAnswer: z.string().describe("Student final answer"),
  scoresTotal: z.number().describe("Total number of scores for the exercise"),
  scoresEarned: z.number().describe("Number of scores earned for the exercise"),
  correctAnswer: z.string().describe("Correct answer for the exercise"),
});

export enum AssessmentState {
  INITIALIZATION = "INITIALIZATION",
  GRADE_SELECTION = "GRADE_SELECTION",
  ASSESSMENT_IN_PROGRESS = "ASSESSMENT_IN_PROGRESS",
  ASSESSMENT_COMPLETED = "ASSESSMENT_COMPLETED",
}

export type SourceMetadata = {
  lessonId: string;
  stationId: string;
  lessonTitle: string;
  stationTitle: string;
  similarity: string;
};

export type Source = {
  metadata: SourceMetadata;
  pageContent: string;
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

export interface MathfieldElement extends HTMLElement {
  value: string;
  smartFence: boolean;
  smartMode: boolean;
  smartSuperscript: boolean;
  readonly: boolean;
  executeCommand: (command: string) => void;
}

export const evaluateExerciseResponseSchema = z.object({
  isCorrect: z.boolean().describe("Whether the student's answer is correct"),
  studentMistake: z
    .string()
    .describe(
      "A description of the student's mistake, if the answer is incorrect, what he is missing, why the logic doesnt hold",
    ),
});
