export enum ProductStyle {
  // Premium Product Mode Styles
  HERO = 'HERO',
  MACRO = 'MACRO',
  LIQUID = 'LIQUID',
  SCULPTURAL = 'SCULPTURAL',
  FLOATING = 'FLOATING',
  SENSORY = 'SENSORY',
  COLOR = 'COLOR',
  INGREDIENT = 'INGREDIENT',
  SURREAL = 'SURREAL',

  // Human Portrait Mode Styles
  MCU = 'MCU',
  MS = 'MS',
  OS = 'OS',
  WS = 'WS',
  HA = 'HA',
  LA = 'LA',
  P = 'P',
  ThreeQ = 'ThreeQ',
  B = 'B'
}

export interface ShotDefinition {
  id: ProductStyle;
  label: string;
  description: string;
  emotional: string;
  promptTemplate: string;
}

// Deprecated but kept to avoid breaking imports during partial refactor if any
export enum SubjectType {
  UNKNOWN = 'unknown',
  PRODUCT = 'product',
  HUMAN = 'human',
  MIXED = 'mixed'
}

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export interface GeneratedImage {
  id: string;
  shotType: ProductStyle;
  imageUrl: string; // Base64 or Blob URL
  isLoading: boolean;
  error?: string;
  timestamp: number;
  customPrompt?: string; // Stores user-edited prompt
  subjectType?: SubjectType; // Stores the mode used (Human/Product)
}

export interface ProductAnalysisResult {
  productName: string;
  description: string; // Visual description of the subject
  category: string;
  confidence: number;
  recommendations: string[];
  isHuman?: boolean;
  framingQuality?: 'ok' | 'too_far' | 'cut_off' | 'empty';
}

export interface ProjectHistory {
  id: string;
  timestamp: number;
  sourceImage: string;
  productName: string;
  productDescription: string;
  productCategory: string;
  subjectType: SubjectType;
  generatedShots: Record<string, GeneratedImage>;
}