
import { BMIStatus, BMIInfo } from '../types';

export const calculateBMI = (heightCm: number, weightKg: number): number => {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
};

export const getBMIInfo = (bmi: number): BMIInfo => {
  if (bmi < 18.5) {
    return {
      status: BMIStatus.UNDERWEIGHT,
      label: '偏瘦 (Underweight)',
      color: 'text-blue-500',
      advice: '您的体重指数较低。建议适当增加优质蛋白和复合碳水化合物的摄入，并结合适度的力量训练。'
    };
  } else if (bmi < 24) {
    return {
      status: BMIStatus.NORMAL,
      label: '正常 (Normal)',
      color: 'text-green-500',
      advice: '您的各项指标处于理想范围。请继续保持均衡饮食和规律的作息习惯。'
    };
  } else if (bmi < 28) {
    return {
      status: BMIStatus.OVERWEIGHT,
      label: '超重 (Overweight)',
      color: 'text-orange-500',
      advice: '目前体重略微超出理想范围。建议开始轻量级的有氧运动，并减少高糖高脂食物的摄入。'
    };
  } else {
    return {
      status: BMIStatus.OBESE,
      label: '肥胖 (Obese)',
      color: 'text-red-500',
      advice: '您的健康风险可能增加。建议咨询医生制定专业的减脂计划，循序渐进地增加中等强度有氧运动。'
    };
  }
};
