export interface LogicConfig {
  slowMode: number;          // Saniye cinsinden (0 = kapalı)
  allowGifs: boolean;        // Giphy/Tenor izni
  profanityFilter: boolean;  // Küfür filtresi aktif mi?
  guestAccess: boolean;      // Üye olmadan giriş izni
  showTyping: boolean;       // "Yazıyor..." bilgisi
  readReceipts: boolean;     // Okundu bilgisi
  stickyMessage?: string;    // Sabitlenmiş duyuru metni
  historyRetentionDays: number; // Plan bazlı mesaj saklama süresi
}