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
Your website files (from the git pull) are likely in a folder. Let's assume:
`/var/www/html/movie-reporter`

## 3. Configure Upload Permissions
The PHP script needs to write to `public/uploads`.

```bash
cd /var/www/html/movie-reporter/public
mkdir -p uploads/profiles
# Give ownership to the web server user (usually www-data)
sudo chown -R www-data:www-data uploads
sudo chmod -R 775 uploads
```

## 4. Configure Nginx
Edit your site configuration file (usually inside `/etc/nginx/sites-available/`).

```bash
sudo nano /etc/nginx/sites-available/movielovers.in
# OR
sudo nano /etc/nginx/sites-available/default
```

You need to add a `location` block for PHP **BEFORE** the Next.js proxy block.

```nginx
server {
    listen 80;
    server_name movielovers.in www.movielovers.in;
    root /var/www/html/movie-reporter/public; # POINT THIS TO YOUR NEXT.JS PUBLIC FOLDER

    # 1. Handle PHP Files
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock; # CHECK YOUR PHP VERSION (ls /var/run/php/)
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 2. Serve Uploaded Images Directly
    location /uploads/ {
        alias /var/www/html/movie-reporter/public/uploads/;
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
