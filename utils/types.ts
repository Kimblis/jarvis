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

export type ExerciseResponse = {
  text: string;
  solutionText: string;
  solutionSkills: string[];
  condition: string;
  topic: string;
  template: string;
  parameters: Record<string, string>;
  assets: Record<string, string>;
};
