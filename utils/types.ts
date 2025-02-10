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
