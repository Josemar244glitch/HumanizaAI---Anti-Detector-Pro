
export enum HumanizationMode {
  HS_STUDENT = 'HS_STUDENT',
  UNI_STUDENT = 'UNI_STUDENT',
  SIMPLE = 'SIMPLE',
  ACADEMIC = 'ACADEMIC',
  PROFESSIONAL = 'PROFESSIONAL'
}

export interface ModeConfig {
  id: HumanizationMode;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface HumanizationResult {
  original: string;
  humanized: string;
  timestamp: number;
  mode: HumanizationMode;
}
