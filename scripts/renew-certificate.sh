docker run -it --rm --name certbot \
  -v /certbot/conf:/etc/letsencrypt \
  -v /certbot/www:/var/www/certbot \
  -v /docker/nginx/www/letsencrypt:/var/www/.well-known \
  quay.io/letsencrypt/letsencrypt -t certonly \
  --agree-tos --renew-by-default \
  --webroot -w /var/www \
  -d visual-ai.app