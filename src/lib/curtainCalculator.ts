// src/lib/curtainCalculator.ts

export interface CurtainCalculationInput {
  widthCm: number       // Lebar tingkap/rel dalam cm
  dropCm: number        // Panjang langsir dalam cm
  fullness: number      // Contoh: 2.0, 2.5
  fabricWidthCm: number // Lebar kain roll dalam cm
  patternRepeatCm: number // Ulangan corak kain dalam cm (0 jika tiada)
  hemAllowanceCm?: number // Lebihan untuk lipatan atas/bawah, default 20
  sideAllowanceCm?: number // Lebihan sisi, default 10
}

export interface CurtainCalculationResult {
  panels: number
  lengthPerPanelCm: number
  totalFabricCm: number
  totalFabricMeter: number
  fabricWidthCm: number
  patternRepeatCm: number
}

export function calculateFabric(input: CurtainCalculationInput): CurtainCalculationResult {
  const {
    widthCm,
    dropCm,
    fullness,
    fabricWidthCm,
    patternRepeatCm,
    hemAllowanceCm = 20,
    sideAllowanceCm = 10,
  } = input

  // 1. Berapa panel/drop diperlukan?
  const panels = Math.max(1, Math.ceil((widthCm * fullness + sideAllowanceCm) / fabricWidthCm))

  // 2. Panjang setiap panel: drop + hem + padanan corak
  let lengthPerPanelCm = dropCm + hemAllowanceCm

  if (patternRepeatCm > 0 && panels > 1) {
    // Tambah satu ulangan corak untuk padanan antara panel
    lengthPerPanelCm += patternRepeatCm
  }

  // 3. Jumlah keseluruhan kain
  const totalFabricCm = panels * lengthPerPanelCm
  const totalFabricMeter = Math.ceil((totalFabricCm / 100) * 10) / 10 // bundar ke 1 titik perpuluhan

  return {
    panels,
    lengthPerPanelCm: Math.ceil(lengthPerPanelCm),
    totalFabricCm: Math.ceil(totalFabricCm),
    totalFabricMeter,
    fabricWidthCm,
    patternRepeatCm,
  }
}