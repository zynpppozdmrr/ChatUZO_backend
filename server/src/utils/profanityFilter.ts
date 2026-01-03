import * as LeoProfanity from 'leo-profanity';

/**
 * Metindeki küfürleri temizler ve yıldızlarla değiştirir
 * @param text - Filtrelenecek metin
 * @returns Filtrelenmiş metin
 */
export function cleanProfanity(text: string): string {
  return LeoProfanity.default.clean(text);
}

/**
 * Metinde küfür olup olmadığını kontrol eder
 * @param text - Kontrol edilecek metin
 * @returns Küfür varsa true
 */
export function hasProfanity(text: string): boolean {
  return LeoProfanity.default.check(text);
}

/**
 * Room ayarlarına göre metni filtreler
 * @param text - Filtrelenecek metin
 * @param filterEnabled - Profanity filter aktif mi?
 * @returns Filtrelenmiş metin (filter aktifse) veya orijinal metin
 */
export function filterMessage(text: string, filterEnabled: boolean): string {
  if (!filterEnabled) {
    return text;
  }
  return cleanProfanity(text);
}
