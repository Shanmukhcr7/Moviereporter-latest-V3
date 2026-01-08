const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

// Firebase Config (Copied from lib/firebase.ts)
const firebaseConfig = {
    apiKey: "AIzaSyB1-OPN7md7pwM4q2YBCxM9hHVEvr3NUWg",
    authDomain: "movie-reporter.firebaseapp.com",
    projectId: "movie-reporter",
    storageBucket: "movie-reporter.firebasestorage.app",
    messagingSenderId: "531723763328",
    appId: "1:531723763328:web:75b34bb4e4c9411778f065",
    measurementId: "G-Z2JF0SXPG7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BASE_URL = 'https://movielovers.in';

const STATIC_ROUTES = [
    '',
    '/movies-info',
    '/movies',
    '/upcoming-releases',
    '/top-boxoffice',
    '/celebrities',
    '/news',
    '/weekly-magazine',
    '/about',
    '/vote-enroll',
    '/polls',
    '/privacy-policy',
    '/terms-of-service',
];

async function fetchAllIds(collectionName) {
    try {
        console.log(`Fetching ${collectionName}...`);
        const q = query(collection(db, "artifacts/default-app-id", collectionName), limit(5000));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        return [];
    }
}

async function generateSitemap() {
    console.log('Starting sitemap generation...');

    try {
        const [movies, celebrities, news, blogs, users] = await Promise.all([
            fetchAllIds('movies'),
            fetchAllIds('celebrities'),
            fetchAllIds('news'),
            fetchAllIds('blogs'),
            fetchAllIds('users'),
        ]);

        console.log(`Found: ${movies.length} movies, ${celebrities.length} celebrities, ${news.length} news, ${blogs.length} blogs, ${users.length} users.`);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Static Routes
        STATIC_ROUTES.forEach(route => {
            xml += `  <url>\n    <loc>${BASE_URL}${route}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
        });

        // Dynamic Routes
        const addUrl = (path, id, freq = 'weekly', priority = '0.8') => {
            xml += `  <url>\n    <loc>${BASE_URL}/${path}/${id}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
        };

        movies.forEach(id => addUrl('movie', id));
        celebrities.forEach(id => addUrl('celebrity', id));
        news.forEach(id => addUrl('news', id, 'daily', '0.9'));
        blogs.forEach(id => addUrl('blog', id));
        users.forEach(id => addUrl('u', id, 'weekly', '0.5'));

        xml += `</urlset>`;

        const publicDir = path.join(__dirname, '..', 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
        }

        const sitemapPath = path.join(publicDir, 'sitemap.xml');
        fs.writeFileSync(sitemapPath, xml);

        console.log(`Sitemap generated successfully at ${sitemapPath}`);
        process.exit(0);
    } catch (error) {
        console.error('Error generating sitemap:', error);
        process.exit(1);
    }
}

generateSitemap();
