# Setting up Profile Upload on VPS (Nginx + PHP)

Since you are using a VPS with Next.js, you usually have Nginx acting as a "Reverse Proxy". By default, Nginx sends everything to Next.js (port 3000), but Next.js **cannot run PHP files**.

You must configure Nginx to intercept `.php` files and send them to `php-fpm`.

## 1. Install PHP and GD Library
Connect to your VPS terminal and run:

```bash
# Update and install PHP + Extensions
sudo apt update
sudo apt install php-fpm php-gd php-common
```

## 2. Locate your Website Root
Based on your setup, your website files are in:
`/var/www/movie-reporter`

## 3. Configure Upload Permissions
You have already created the `uploads` folder in your project root.
Ensure it is writable by the web server (which you likely did):

```bash
cd /var/www/movie-reporter
sudo chown -R www-data:www-data uploads
sudo chmod -R 775 uploads
```

## 4. Configure Nginx
Edit your site configuration file (e.g., `/etc/nginx/sites-available/movielovers.in`).

```nginx
server {
    listen 80;
    server_name movielovers.in www.movielovers.in;
    root /var/www/movie-reporter/public; # Next.js public files are here

    # 1. Handle PHP Files (The Upload Script)
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock; # VERIFY THIS PATH (ls /var/run/php/)
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 2. Serve Uploaded Images Directly (From the sibling folder)
    location /uploads/ {
        # This maps https://site.com/uploads/... -> /var/www/movie-reporter/uploads/...
        alias /var/www/movie-reporter/uploads/; 
        access_log off;
        expires max;
    }

    # 3. Everything else goes to Next.js
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

**Important**: 
- Replace `/var/www/html/movie-reporter/public` with your actual path.
- Check your PHP version folder: `ls /var/run/php/` to see if it is `php8.1-fpm.sock` or `php8.2-fpm.sock` etc.

## 5. Restart Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Diagnosis
Now run the check script from your browser again:
`https://movielovers.in/server-check.php`
