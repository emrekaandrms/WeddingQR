// Tam ve Düzeltilmiş server.js Kodu

const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const path = require('path');
const cors = require('cors');
// Bu satırın en yukarıda olması gerekiyor
const { Readable } = require('stream');

const app = express();
app.use(cors());

// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Frontend dosyalarını serve et
app.use(express.static(path.join(__dirname, 'frontend')));

// --- AYARLAR ---
// !!! BU SATIRI KENDİ KLASÖR ID'NİZ İLE DEĞİŞTİRİN !!!
const DRIVE_FOLDER_ID = '1ZWL6g4fJrwfhJhOot2N2P-MNfXr148mY'; 
// --- BİTTİ ---

const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Google Auth'u ortam değişkenlerine göre yapılandır
let auth;
let isGoogleConfigured = false;

try {
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        // Railway (veya değişkenin ayarlandığı başka bir ortam) için
        console.log('Google Credentials ortam değişkeninden yükleniyor...');
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });
        isGoogleConfigured = true;
        console.log('✅ Google Credentials başarıyla yüklendi');
    } else {
        // Yerel geliştirme için
        console.log('⚠️  GOOGLE_CREDENTIALS_JSON ortam değişkeni bulunamadı');
        console.log('Yerel credentials.json dosyası aranıyor...');
        const KEYFILEPATH = path.join(__dirname, 'backend/credentials.json');
        auth = new google.auth.GoogleAuth({
            keyFile: KEYFILEPATH,
            scopes: SCOPES,
        });
        isGoogleConfigured = true;
        console.log('✅ Yerel credentials.json dosyası yüklendi');
    }
} catch (error) {
    console.error('❌ Google Auth yapılandırma hatası:', error.message);
    isGoogleConfigured = false;
}

const upload = multer({ storage: multer.memoryStorage() });

// Test endpoint
app.get('/test', (req, res) => {
    const status = {
        message: 'Backend çalışıyor!',
        timestamp: new Date().toISOString(),
        googleConfigured: isGoogleConfigured,
        driveFolder: DRIVE_FOLDER_ID
    };
    
    console.log('Test endpoint çağrıldı:', status);
    res.json(status);
});

app.post('/upload', upload.array('files'), async (req, res) => {
    console.log('📁 Upload isteği alındı, dosya sayısı:', req.files ? req.files.length : 0);
    
    // Google konfigürasyonu kontrolü
    if (!isGoogleConfigured) {
        console.error('❌ Google Drive konfigürasyonu eksik');
        return res.status(500).send('Google Drive bağlantısı yapılandırılmamış. Lütfen yöneticiye haber verin.');
    }
    
    try {
        if (!req.files || req.files.length === 0) {
            console.log('⚠️  Hiç dosya gönderilmedi');
            return res.status(400).send('Hiç dosya yüklenmedi.');
        }

        console.log('🔗 Google Drive servisi başlatılıyor...');
        const driveService = google.drive({ version: 'v3', auth });

        for (const file of req.files) {
            console.log(`📤 Yükleniyor: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
            
            const fileMetadata = {
                name: file.originalname,
                parents: [DRIVE_FOLDER_ID],
            };
            
            const media = {
                mimeType: file.mimetype,
                body: Readable.from(file.buffer),
            };

            const result = await driveService.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id,name',
            });
            
            console.log(`✅ Yüklendi: ${result.data.name} (ID: ${result.data.id})`);
        }

        const successMessage = `${req.files.length} dosya başarıyla Google Drive'a yüklendi!`;
        console.log('🎉', successMessage);
        res.status(200).send(successMessage);

    } catch (error) {
        console.error('❌ YÜKLEME HATASI:', error);
        
        // Google API hatalarını daha anlaşılır hale getir
        let userMessage = 'Dosyalar yüklenirken bir hata oluştu.';
        
        if (error.message.includes('Invalid Credentials')) {
            userMessage = 'Google Drive bağlantı bilgileri geçersiz.';
        } else if (error.message.includes('Forbidden')) {
            userMessage = 'Google Drive klasörüne erişim izni yok.';
        } else if (error.message.includes('Not Found')) {
            userMessage = 'Google Drive klasörü bulunamadı.';
        } else if (error.code === 'ENOTFOUND') {
            userMessage = 'İnternet bağlantısı sorunu.';
        }
        
        res.status(500).send(userMessage);
    }
});

// Ana sayfa için route
app.get('/', (req, res) => {
    console.log('🏠 Ana sayfa isteği alındı');
    res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// 404 handler
app.use((req, res) => {
    console.log('❓ 404 - Bulunamadı:', req.path);
    res.status(404).send('Sayfa bulunamadı');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend sunucusu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`📊 Google Drive yapılandırması: ${isGoogleConfigured ? '✅ OK' : '❌ Eksik'}`);
});