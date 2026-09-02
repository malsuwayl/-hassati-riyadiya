import { MeasurementItem, GradingRange } from '../types';

export interface BMIResult {
  bmi: number;
  statusKey: 'underweight' | 'normal' | 'overweight' | 'obese';
  statusAr: string;
}

export function calculateBMI(heightCm: number, weightKg: number): BMIResult | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const heightMeters = heightCm / 100;
  const bmi = Number((weightKg / (heightMeters * heightMeters)).toFixed(1));

  let statusKey: BMIResult['statusKey'] = 'normal';
  let statusAr = 'وزن طبيعي';

  if (bmi < 18.5) {
    statusKey = 'underweight';
    statusAr = 'نقص في الوزن (نحافة)';
  } else if (bmi >= 18.5 && bmi < 25) {
    statusKey = 'normal';
    statusAr = 'وزن طبيعي وذو لياقة';
  } else if (bmi >= 25 && bmi < 30) {
    statusKey = 'overweight';
    statusAr = 'زيادة في الوزن';
  } else {
    statusKey = 'obese';
    statusAr = 'سمنة (مفرطة)';
  }

  return { bmi, statusKey, statusAr };
}

/**
 * Parses time string like "02:34" or "2:34" or "154" into seconds (e.g. 154)
 */
export function parseTimeToSeconds(valStr: string | number | undefined): number | null {
  if (valStr === undefined || valStr === null || valStr === '') return null;
  if (typeof valStr === 'number') return valStr;

  const str = String(valStr).trim();
  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length === 2) {
      const mins = parseFloat(parts[0]) || 0;
      const secs = parseFloat(parts[1]) || 0;
      return mins * 60 + secs;
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Formats seconds e.g. 154 into "02:34"
 */
export function formatSecondsToTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return '';
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  const minsPadded = String(mins).padStart(2, '0');
  const secsPadded = String(secs).padStart(2, '0');
  return `${minsPadded}:${secsPadded}`;
}

export interface EvaluationResult {
  score: number;
  maxScore: number;
  levelName: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف' | 'غير محدد';
}

/**
 * Evaluates a measurement value against an item's grading ranges
 */
export function evaluateMeasurementValue(
  valStr: string | number | undefined,
  item: MeasurementItem
): EvaluationResult | null {
  if (valStr === undefined || valStr === null || valStr === '') return null;

  let numVal: number | null = null;
  if (item.unit === 'mm:ss' || item.inputType === 'time') {
    numVal = parseTimeToSeconds(valStr);
  } else {
    numVal = parseFloat(String(valStr));
  }

  if (numVal === null || isNaN(numVal)) return null;

  const ranges = item.gradingRanges || [];
  if (ranges.length === 0) {
    // Default fallback when no custom range
    return {
      score: Math.min(item.maxGrade, Math.max(0, Math.round(numVal))),
      maxScore: item.maxGrade,
      levelName: 'غير محدد',
    };
  }

  // Find matching range
  for (const r of ranges) {
    if (numVal >= r.minVal && numVal <= r.maxVal) {
      return {
        score: r.score,
        maxScore: item.maxGrade,
        levelName: r.levelName,
      };
    }
  }

  // If outside ranges
  if (item.betterDirection === 'lower') {
    // If lower than min, top tier
    const minRange = ranges.reduce((min, cur) => (cur.minVal < min.minVal ? cur : min), ranges[0]);
    if (numVal < minRange.minVal) {
      return { score: item.maxGrade, maxScore: item.maxGrade, levelName: 'ممتاز' };
    }
    return { score: 2, maxScore: item.maxGrade, levelName: 'ضعيف' };
  } else {
    // Higher is better: if above max, top tier
    const maxRange = ranges.reduce((max, cur) => (cur.maxVal > max.maxVal ? cur : max), ranges[0]);
    if (numVal > maxRange.maxVal) {
      return { score: item.maxGrade, maxScore: item.maxGrade, levelName: 'ممتاز' };
    }
    return { score: 2, maxScore: item.maxGrade, levelName: 'ضعيف' };
  }
}

/**
 * Calculates overall physical fitness total score and rating for a student
 */
export function calculateStudentFitnessSummary(
  studentId: string,
  measurementItems: MeasurementItem[],
  measurementValues: Record<string, Record<string, string | number>>
) {
  const stVals = measurementValues[studentId] || {};
  let totalScore = 0;
  let totalMaxPossible = 0;
  let evaluatedCount = 0;

  measurementItems.forEach((item) => {
    const val = stVals[item.id];
    const evalRes = evaluateMeasurementValue(val, item);
    if (evalRes) {
      totalScore += evalRes.score;
      totalMaxPossible += evalRes.maxScore;
      evaluatedCount++;
    }
  });

  if (evaluatedCount === 0 || totalMaxPossible === 0) {
    return {
      totalScore: 0,
      totalMaxPossible: 0,
      percentage: 0,
      ratingLevel: '-',
    };
  }

  const percentage = Math.round((totalScore / totalMaxPossible) * 100);
  let ratingLevel = 'مقبول';
  if (percentage >= 90) ratingLevel = 'ممتاز';
  else if (percentage >= 80) ratingLevel = 'جيد جداً';
  else if (percentage >= 70) ratingLevel = 'جيد';
  else if (percentage >= 60) ratingLevel = 'مقبول';
  else ratingLevel = 'ضعيف';

  return {
    totalScore,
    totalMaxPossible,
    percentage,
    ratingLevel,
  };
}
