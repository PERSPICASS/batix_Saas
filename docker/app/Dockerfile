FROM php:8.4-fpm-alpine AS base

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
    libzip-dev \
    mysql-client \
    postgresql-client \
    postgresql-dev \
    supervisor \
    nginx \
    nodejs \
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

# Fix git ownership
RUN git config --global --add safe.directory /var/www/html

# Copy application files
COPY . .

# Install dependencies & build
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress \
    && npm install \
    && npm run build \
    && mkdir -p storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
    && chmod -R 775 storage bootstrap/cache

# Optimize Laravel
RUN php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

# Production stage
FROM php:8.4-fpm-alpine AS production

WORKDIR /var/www/html

# nodejs : exécute le bundle SSR d'Inertia (bootstrap/ssr/ssr.js, produit par `npm run
# build` dans l'étage base et recopié plus bas avec node_modules, dont le bundle dépend
# encore à l'exécution pour react-dom/server). Sans ce binaire, le service ssr ne peut
# pas démarrer et le site sert aux crawlers une page vide — voir docs/SSR_DEPLOYMENT.md.
RUN apk add --no-cache \
    mysql-client \
    postgresql-client \
    postgresql-dev \
    nodejs && \
    docker-php-ext-install \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    bcmath \
    pcntl && \
    apk del postgresql-dev

COPY --from=base /var/www/html /var/www/html

# Only change ownership of writable directories to avoid timeout
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 755 /var/www/html/storage && \
    chmod -R 755 /var/www/html/bootstrap/cache

COPY docker/app/php.ini /usr/local/etc/php/conf.d/laravel.ini
COPY docker/app/www.conf /usr/local/etc/php-fpm.d/www.conf

# Create log directories and files with proper permissions
RUN mkdir -p /var/log/php && \
    chmod 755 /var/log/php && \
    touch /var/log/php/error.log && \
    chmod 644 /var/log/php/error.log && \
    chown www-data:www-data /var/log/php /var/log/php/error.log

EXPOSE 9000

CMD ["/usr/local/sbin/php-fpm", "--nodaemonize"]