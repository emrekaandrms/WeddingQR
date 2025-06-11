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

// --- AYARLAR ---
// !!! BU SATIRI KENDİ KLASÖR ID'NİZ İLE DEĞİŞTİRİN !!!
const DRIVE_FOLDER_ID = '1ZWL6g4fJrwfhJhOot2N2P-MNfXr148mY'; 
// --- BİTTİ ---

const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Google Auth'u ortam değişkenlerine göre yapılandır
let auth;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    // Railway (veya değişkenin ayarlandığı başka bir ortam) için
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });
} else {
    // Yerel geliştirme için
    const KEYFILEPATH = path.join(__dirname, 'credentials.json');
    auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: SCOPES,
    });
}

const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).send('Hiç dosya yüklenmedi.');
        }

        const driveService = google.drive({ version: 'v3', auth });

        for (const file of req.files) {
            const fileMetadata = {
                name: file.originalname,
                parents: [DRIVE_FOLDER_ID],
            };
            
            // ESKİ VE HATALI KODUN YERİNE GELEN DOĞRU KOD
            const media = {
                mimeType: file.mimetype,
                // Hafızadaki dosya verisinden (buffer) bir akış (stream) oluşturuyoruz
                body: Readable.from(file.buffer),
            };

            await driveService.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
            });
        }

        console.log('Dosyalar başarıyla yüklendi.');
        res.status(200).send('Dosyalar başarıyla yüklendi!');

    } catch (error) {
        console.error('YÜKLEME SIRASINDA DETAYLI HATA:', error);
        res.status(500).send('Dosyalar yüklenirken sunucuda bir hata oluştu.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});