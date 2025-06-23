// Tam ve Düzeltilmiş server.js Kodu

const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const cors = require('cors');
const { Readable } = require('stream');
const Busboy = require('busboy');

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
const DRIVE_FOLDER_ID = '1ZWL6g4fJrwfhJhOot2N2P-MNfXr148mY'; 
// --- BİTTİ ---

const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Google Auth'u ortam değişkenlerine göre yapılandır
let auth;
let isGoogleConfigured = false;

try {
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        console.log('Google Credentials ortam değişkeninden yükleniyor...');
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
        isGoogleConfigured = true;
        console.log('✅ Google Credentials başarıyla yüklendi');
    } else if (process.env.type && process.env.private_key && process.env.client_email) {
        console.log('Google Credentials ayrı variable\'lardan yükleniyor...');
        const credentials = {
            type: process.env.type,
            project_id: process.env.project_id,
            private_key_id: process.env.private_key_id,
            private_key: process.env.private_key.replace(/\\n/g, '\n'),
            client_email: process.env.client_email,
            client_id: process.env.client_id,
            auth_uri: process.env.auth_uri,
            token_uri: process.env.token_uri,
            auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
            client_x509_cert_url: process.env.client_x509_cert_url,
            universe_domain: process.env.universe_domain || 'googleapis.com'
        };
        auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
        isGoogleConfigured = true;
        console.log('✅ Google Credentials ayrı variable\'lardan başarıyla yüklendi');
    } else {
        console.log('⚠️  Ortam değişkenleri bulunamadı');
        console.log('Yerel credentials.json dosyası aranıyor...');
        const KEYFILEPATH = path.join(__dirname, 'credentials.json');
        auth = new google.auth.GoogleAuth({ keyFile: KEYFILEPATH, scopes: SCOPES });
        isGoogleConfigured = true;
        console.log('✅ Yerel credentials.json dosyası yüklendi');
    }
} catch (error) {
    console.error('❌ Google Auth yapılandırma hatası:', error.message);
    isGoogleConfigured = false;
}

// Multer kaldırıldı, artık Busboy kullanılıyor.

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

// Dosyaları hafızaya almadan doğrudan Google Drive'a stream eden yeni upload endpoint'i
app.post('/upload', (req, res) => {
    console.log('📁 Upload isteği alındı, streaming başlıyor...');

    if (!isGoogleConfigured) {
        console.error('❌ Google Drive konfigürasyonu eksik');
        return res.status(500).send('Google Drive bağlantısı yapılandırılmamış.');
    }

    const busboy = Busboy({ headers: req.headers });
    const driveService = google.drive({ version: 'v3', auth });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(`📤 Yükleniyor: ${filename} (${mimetype})`);

        const fileMetadata = {
            name: filename,
            parents: [DRIVE_FOLDER_ID],
        };

        const media = {
            mimeType: mimetype,
            body: file, // Dosya stream'ini doğrudan body olarak veriyoruz
        };

        driveService.files.create(
            {
                resource: fileMetadata,
                media: media,
                fields: 'id,name',
            },
            (err, result) => {
                if (err) {
                    console.error('❌ YÜKLEME HATASI:', err);
                    // Hata durumunda stream'i sonlandırıp hatayı client'a gönderiyoruz
                    // Ancak busboy'da bu doğrudan basit değil, en iyisi isteği sonlandırmak.
                    if (!res.headersSent) {
                       res.status(500).send(`Dosya yüklenirken hata oluştu: ${err.message}`);
                    }
                    return;
                }
                console.log(`✅ Yüklendi: ${result.data.name} (ID: ${result.data.id})`);
                // Başarılı olursa client'a cevap gönder
                 if (!res.headersSent) {
                    res.status(200).send(`1 dosya başarıyla Google Drive'a yüklendi!`);
                 }
            }
        );
    });
    
    busboy.on('finish', () => {
        console.log('🎉 Upload stream bitti.');
        // Normalde burada response gönderilirdi ama 'file' callback'i içinde gönderiyoruz.
        // Google API callback'i asenkron olduğu için en güvenli yer orası.
    });

    busboy.on('error', err => {
        console.error('Busboy hatası:', err);
        req.unpipe(busboy);
        if (!res.headersSent) {
            res.status(500).send('Dosya parse etme hatası.');
        }
    });

    req.pipe(busboy);
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend sunucusu 0.0.0.0:${PORT} adresinde çalışıyor`);
    console.log(`📊 Google Drive yapılandırması: ${isGoogleConfigured ? '✅ OK' : '❌ Eksik'}`);
});