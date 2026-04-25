
export interface HealthRecord {
  id: string;
  date: string;
  height: number; // cm
  weight: number; // kg
  bmi: number;
}

export enum BMIStatus {
  UNDERWEIGHT = 'UNDERWEIGHT',
  NORMAL = 'NORMAL',
  OVERWEIGHT = 'OVERWEIGHT',
  OBESE = 'OBESE'
}

export interface BMIInfo {
  status: BMIStatus;
  label: string;
  color: string;
  advice: string;
}
