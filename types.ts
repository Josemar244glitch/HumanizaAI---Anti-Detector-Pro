
export enum AppMode {
  HS_STUDENT = 'HS_STUDENT',
  UNI_STUDENT = 'UNI_STUDENT',
  SIMPLE = 'SIMPLE',
  ACADEMIC = 'ACADEMIC',
  PROFESSIONAL = 'PROFESSIONAL',
  SEARCH = 'SEARCH'
}

export interface ModeConfig {
  id: AppMode;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface ServiceResult {
  original: string;
  humanized: string;
  timestamp: number;
  mode: AppMode;
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}
