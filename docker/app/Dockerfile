FROM php:8.3-fpm-alpine AS base

WORKDIR /var/www/html

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    zip \
    unzip \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    mysql-client \
    postgresql-client \
    supervisor \
    nginx \
    node \
    npm

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install -j$(nproc) \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    gd \
    bcmath \
    zip \
    pcntl

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress --no-suggest 2>&1 | grep -v "^Using version" || true

# Install Node dependencies and build assets
RUN npm install && npm run build

# Create necessary directories
RUN mkdir -p storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs && \
    chmod -R 775 storage bootstrap/cache

# Optimize Laravel
RUN php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

# Production stage
FROM php:8.3-fpm-alpine AS production

WORKDIR /var/www/html

# Install minimal runtime dependencies
RUN apk add --no-cache \
    mysql-client \
    postgresql-client \
    nginx \
    supervisor

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    bcmath

# Copy from base stage
COPY --from=base /var/www/html /var/www/html

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html/storage && \
    chmod -R 755 /var/www/html/bootstrap/cache

# Nginx configuration
COPY docker/app/nginx.conf /etc/nginx/nginx.conf
COPY docker/app/default.conf /etc/nginx/conf.d/default.conf

# Supervisor configuration
COPY docker/app/supervisor.conf /etc/supervisord.conf

# PHP configuration
COPY docker/app/php.ini /usr/local/etc/php/conf.d/laravel.ini
COPY docker/app/www.conf /usr/local/etc/php-fpm.d/www.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
