export type StretchType = 'kaku' | 'sedikit_stretch' | 'stretch';
export type FitLabel = 'snug' | 'regular' | 'loose';

export interface BodyMeasurements {
  chest: number; // Lingkar dada tubuh (cm)
  waist?: number; // Lingkar pinggang tubuh (cm)
  shoulder?: number; // Lebar bahu tubuh (cm)
  height?: number;
  weight?: number;
}

export interface GarmentMeasurements {
  chest_width: number; // Lebar dada kaos datar / flat (cm)
  hem_width?: number; // Lebar bawah kaos datar / flat (cm)
  shoulder?: number; // Lebar bahu kaos (cm)
  length?: number;
  stretch_type: StretchType;
}

export interface FitCalculationResult {
  chest_ease_cm: number;
  fit_label: FitLabel;
  warnings: string[];
}

const SNUG_THRESHOLD: Record<StretchType, number> = {
  kaku: 6,
  sedikit_stretch: 5,
  stretch: 4,
};

const LOOSE_THRESHOLD = 16;

export function calculateFit(
  body: BodyMeasurements,
  garment: GarmentMeasurements
): FitCalculationResult {
  const chest_ease_cm = Number((2 * garment.chest_width - body.chest).toFixed(2));
  const snugLimit = SNUG_THRESHOLD[garment.stretch_type];

  let fit_label: FitLabel;
  if (chest_ease_cm < snugLimit) {
    fit_label = 'snug';
  } else if (chest_ease_cm <= LOOSE_THRESHOLD) {
    fit_label = 'regular';
  } else {
    fit_label = 'loose';
  }

  const warnings: string[] = [];

  if (garment.shoulder != null && body.shoulder != null) {
    const shoulderDiff = garment.shoulder - body.shoulder;
    if (shoulderDiff < -1) {
      warnings.push('Sempit di bahu');
    } else if (shoulderDiff > 3) {
      warnings.push('Jatuh longgar di bahu');
    }
  }

  if (garment.hem_width != null && body.waist != null) {
    if (2 * garment.hem_width - body.waist < 0) {
      warnings.push('Ketat di pinggang');
    }
  }

  return {
    chest_ease_cm,
    fit_label,
    warnings,
  };
}
