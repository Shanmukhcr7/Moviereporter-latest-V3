# Setting up Movie Reporter on VPS (Node.js + Nginx)

GREAT NEWS: We have switched to a pure Node.js solution (like the Admin Dashboard). **You do NOT need PHP.**

## 1. Configure Persistent Uploads
Since you redeploy/pull code, we want uploads to stay safe outside the code folder.
You already created: `/var/www/movie-reporter/uploads`

We need to tell the App to save files there.

**Create/Edit `.env.local` or `.env.production` on your server:**

```bash
cd /var/www/movie-reporter
nano .env.local
```

**Add this line:**
```bash
UPLOAD_DIR=/var/www/movie-reporter/uploads
```
*(This tells the API to save files to your external uploads folder instead of inside the code)*

## 2. Nginx Configuration
Your Nginx config is now much simpler. We just Proxy to Next.js, and Serve the standard `/uploads` URL from your folder.

```nginx
server {
    listen 80;
    server_name movielovers.in www.movielovers.in;
    
    # 1. Serve Uploads Directly (Fast & Efficient)
    location /uploads/ {
        alias /var/www/movie-reporter/uploads/;
        autoindex off;
        expires max;
    }

    # 2. Proxy everything else to Next.js App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 3. Apply Changes
1.  **Restart Nginx**: `sudo systemctl restart nginx`
2.  **Restart Your App**: 
    If you use pm2: `pm2 restart all`
    Or `npm start`

