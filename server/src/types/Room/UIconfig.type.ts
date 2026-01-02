export type ThemeType = 'light' | 'dark' | 'system';
export type BubbleStyle = 'rounded' | 'sharp' | 'modern';
export type FontWeight = 'light' | 'regular' | 'medium' | 'bold';

export interface FontSettings {
  family: string;     // Örn: "Inter"
  baseSize: number;   // Örn: 14
  weight: FontWeight; // Örn: "medium"
}

export interface UISettings {
  theme: ThemeType;
  primaryColor: string; // Hex kodu
  bgType: 'color' | 'gradient' | 'image';
  bgValue: string;      // Renk kodu veya resim URL'si
  bubbleStyle: BubbleStyle;
  fontSettings: FontSettings;
  headerTitle: string;
  showBranding: boolean; // "Powered by" yazısı (Premium kontrolü için)
}