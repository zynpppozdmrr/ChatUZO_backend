# Railway Deployment Rehberi - ChatUZO Backend

Bu dokümanda ChatUZO backend servisinin Railway'e nasıl deploy edileceği adım adım anlatılmaktadır.

## ⚡ Hızlı Başlangıç

| Adım | Açıklama | Süre |
|------|----------|------|
| 1️⃣ | GitHub repo'yu Railway'e bağla | 2 dk |
| 2️⃣ | Environment variables ayarla (DATABASE_URL, JWT_SECRET, CLIENT_ORIGIN) | 3 dk |
| 3️⃣ | Deploy et ve logları kontrol et | 5 dk |
| ✅ | Backend live! | - |

**Toplam Süre**: ~10 dakika

**Not**: Railway'de ayrı PostgreSQL eklemenize gerek YOK - mevcut Neon DB'nizi kullanacaksınız.

## 📋 Ön Gereksinimler

1. Railway hesabı ([railway.app](https://railway.app))
2. GitHub hesabı ve repository'niz Railway'e bağlı olmalı
3. Proje dosyaları commit edilmiş olmalı
4. **Neon PostgreSQL Database** ([neon.tech](https://neon.tech))
   - Neon Dashboard'dan CONNECTION STRING alınmış olmalı
   - Önerilen: **Pooled Connection** string'ini kullanın

### Neon Database Connection String Alma

1. [Neon Dashboard](https://console.neon.tech)'a gidin
2. Projenizi seçin
3. "Connection Details" bölümüne gidin
4. **"Pooled Connection"** seçeneğini seçin (daha iyi performans için)
5. Connection string'i kopyalayın:
   ```
   postgresql://username:password@ep-xxx.neon.tech/dbname?sslmode=require
   ```

**Not**: Railway'de ayrı PostgreSQL database eklemenize gerek YOK, mevcut Neon DB'nizi kullanacaksınız.

## 🚀 Deployment Adımları

### 1. Railway Projesi Oluşturma

1. [Railway Dashboard](https://railway.app/dashboard)'a gidin
2. "New Project" butonuna tıklayın
3. "Deploy from GitHub repo" seçeneğini seçin
4. ChatUZO_backend repository'nizi seçin
5. "Deploy Now" butonuna tıklayın

**Not**: Railway otomatik olarak Nixpacks (modern build sistem) kullanarak projenizi build edecek. Dockerfile'a gerek yok!

### 2. Environment Variables Ayarlama

Backend service'inizi seçin ve "Variables" sekmesine gidin. Aşağıdaki environment variables'ları ekleyin:

#### Gerekli Environment Variables:

```env
# Database (Mevcut Neon DB connection string'inizi kullanın)
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/dbname?sslmode=require

# JWT Secret (güçlü bir secret oluşturun)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Client Origin (Frontend URL'iniz)
CLIENT_ORIGIN=https://your-frontend-url.com

# Port (Railway otomatik atar, değiştirmeyin)
PORT=3000
```

**Önemli Notlar:**
- `DATABASE_URL`: Neon Dashboard'unuzdan alın (Connection String > Pooled Connection önerilir)
- `JWT_SECRET`: Güçlü, rastgele bir string kullanın (min 32 karakter önerilir)
- `CLIENT_ORIGIN`: Frontend'iniz deploy edildikten sonra güncellenmelidir
- Geliştirme aşamasında `CLIENT_ORIGIN` değerini `*` yapabilirsiniz (güvenli değil, sadece test için)
- `PORT`: Railway otomatik olarak atar, genellikle bu değişkeni eklemenize gerek yok

### 3. Database Migration Çalıştırma

Deployment sırasında Dockerfile içindeki CMD otomatik olarak migration'ları çalıştıracak:

```bash
npx prisma migrate deploy
```

**Not**: Mevcut Neon DB'nize migration'lar uygulanacak. Eğer database'de zaten data varsa dikkatli olun!

Eğer manuel çalıştırmak isterseniz:

1. Railway dashboard'da backend service'inizi seçin
2. "Settings" > "Deploy Logs" bölümünden migration loglarını kontrol edin
3. Veya Railway CLI ile:

```bash
railway run npx prisma migrate deploy
```

### 4. Deployment Durumunu Kontrol Etme

1. Railway dashboard'da "Deployments" sekmesine gidin
2. Build logs'u kontrol edin
3. Başarılı deployment sonrası "View Logs" ile runtime logs'u izleyin
### 5. Custom Domain Ekleme (Opsiyonel)gs > Domains bölümünden)

### 6. Custom Domain Ekleme (Opsiyonel)

1. Backend service'inizi seçin
2. "Settings" > "Domains" bölümüne gidin
3. "Add Custom Domain" butonuna tıklayın
4. Domain'inizi girin ve DNS ayarlarını yapın

## 🔧 Deployment Sonrası Yapılandırma

### Build Sistemi: Nixpacks

Railway otomatik olarak **Nixpacks** kullanarak build ediyor. Bu, Dockerfile'a gerek olmayan modern bir build sistem.

**Nixpacks'in avantajları**:
- ✅ Otomatik dependency detection
- ✅ Node.js, npm, Prisma otomatik algılanıyor
- ✅ `.railwayignore` ile gereksiz dosyaları exclude ediyor
- ✅ Production-optimized imaj oluşturuyor

**Build akışı**:
1. `npm ci` - Dependencies yükleniyor
2. `npm run build` - TypeScript compile ediliyor
3. `npm start` - Server başlatılıyor (migration + app başlar)

### CORS Ayarları

Production'da `index.ts` dosyasındaki CORS ayarlarını güncelleyin:

```typescript
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_ORIGIN || "https://your-frontend-url.com",
        methods: ["GET", "POST"],
        credentials: true
    }
});
```

### Environment Variables'ları Güncelleme

Frontend deploy edildikten sonra:

1. Railway dashboard'da backend service'inizi seçin
2. "Variables" sekmesine gidin
3. `CLIENT_ORIGIN` değerini frontend URL'i ile güncelleyin
4. Service otomatik olarak yeniden deploy edilecek

## 🛠️ Railway CLI Kullanımı (Opsiyonel)

Railway CLI ile local'den deploy edebilirsiniz:

### CLI Kurulumu

```bash
npm i -g @railway/cli
```

### Login ve Deploy

```bash
# Railway'e login
railway login

# Projeyi link et
railway link

# Deploy
railway up

# Environment variables ayarla
railway variables set JWT_SECRET=your-secret-key

# Logs izle
railway logs
```

## 📊 Monitoring ve Logs

### Logs Görüntüleme

1. Railway dashboard'da service'inizi seçin
2. "Logs" sekmesine gidin
3. Real-time logs akışını izleyin

### Metrics

1. "Metrics" sekmesinde CPU, RAM ve Network kullanımını görün
2. Performance sorunlarını tespit edin

## 🔐 Güvenlik Önerileri

1. **JWT_SECRET**: Güçlü, rastgele bir string kullanın (min 32 karakter)
2. **CORS**: Production'da sadece güvenilir domain'lere izin verin
3. **Environment Variables**: Hassas bilgileri asla kod içinde tutmayın
4. **Database**: Neon DB connection string'inde `?sslmode=require` parametresini kullanın
5. **Rate Limiting**: Production'da rate limiting ekleyin

## 🐛 Yaygın Sorunlar ve Çözümleri

### 1. Migration Hatası

**Sorun**: `prisma migrate deploy` başarısız oluyor

**Çözüm**:
- Neon DB DATABASE_URL'in doğru olduğundan emin olun
- Neon DB'nizin aktif olduğunu kontrol edin (Neon otomatik suspend yapabilir)
- Connection string'in sonunda `?sslmode=require` parametresi olmalı
- Railway logs'u kontrol edin
- Neon Dashboard'dan database'in erişilebilir olduğunu doğrulayın

### 2. Port Binding Hatası

**Sorun**: Server PORT'a bind olamıyor

**Çözüm**:
- Railway otomatik olarak PORT environment variable'ı sağlar
- `env.ts` dosyanızın `process.env.PORT`'u kullandığından emin olun

### 3. WebSocket Connection Hatası

**Sorun**: Socket.IO bağlantı kuramıyor

**Çözüm**:
- CORS ayarlarını kontrol edin
- Frontend'de doğru backend URL'i kullanıldığından emin olun
- Railway'de WebSocket desteği varsayılan olarak aktiftir

### 4. Build Hatası

**Sorun**: TypeScript build başarısız oluyor

**Çözüm**:
- `tsconfig.json` dosyasını kontrol edin
- Gerekli tüm type definitions kurulu olduğundan emin olun
- `package.json` scripts'lerini kontrol edin

## 📞 Destek

Railway dokümantasyonu: https://docs.railway.app
Railway Discord: https://discord.gg/railway

## 🎉 Deploy Başarılı!

Backend service'iniz şimdi Railway'de live! 

**Backend URL**: `https://your-service-name.railway.app`

Bu URL'i frontend'inizde kullanarak API ve WebSocket bağlantılarını kurabilirsiniz.

### Test Etme

```bash
# Health check (eğer endpoint varsa)
curl https://your-service-name.railway.app/health

# API test
curl https://your-service-name.railway.app/api/auth/test
```

## 🔄 Güncelleme ve Yeniden Deployment

Railway otomatik olarak GitHub'daki her push'u deploy eder:

1. Değişikliklerinizi commit edin
2. GitHub'a push edin
3. Railway otomatik olarak build ve deploy edecek

Manuel deployment için Railway CLI:

```bash
railway up
```

## 📈 Ölçeklendirme

Railway üzerinde service'inizi scale edebilirsiniz:

1. Service'inizi seçin
2. "Settings" > "Resources" bölümüne gidin
3. CPU ve RAM değerlerini artırın
4. Daha fazla replica için Railway Pro plan gereklidir

---

**Not**: Bu deployment rehberi Railway platform'una ve Neon PostgreSQL database kullanımına özeldir. Farklı bir platform (Heroku, AWS, DigitalOcean vb.) kullanıyorsanız adımlar farklılık gösterebilir.

## 🗄️ Neon Database Bilgileri

### Avantajları:
- ✅ Serverless PostgreSQL (otomatik scale)
- ✅ Free tier: 0.5 GB storage, 10 projects
- ✅ Otomatik backup
- ✅ Connection pooling built-in
- ✅ Railway'den bağımsız (farklı platformlarda da kullanabilirsiniz)

### Dikkat Edilmesi Gerekenler:
- ⚠️ Free tier otomatik suspend yapabilir (inaktivite durumunda)
- ⚠️ İlk bağlantıda 1-2 saniye gecikme olabilir (cold start)
- ✅ Production için Neon Pro plan önerilir

### Connection String Formatı:
```
postgresql://username:password@ep-xxx-yyy.neon.tech/dbname?sslmode=require
                                 ↑
                        Neon endpoint (her proje için benzersiz)
```

### Neon Dashboard:
- Connection Details: Connection string'i alın
- Branches: Development/staging branch'leri oluşturun
- Usage: Database kullanım metrikleri
- Settings: Database silme, reset, vb.
