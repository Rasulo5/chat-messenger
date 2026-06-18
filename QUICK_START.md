# 🚀 Готово к деплою!

Ваш чат **полностью готов** к развёртыванию на TimeWeb Cloud или любом другом хостинге!

## ✅ Что сделано:

- ✅ Создан Dockerfile для контейнеризации
- ✅ Подготовлены инструкции для VPS
- ✅ Настроена production сборка
- ✅ Добавлены все конфигурационные файлы
- ✅ Создан подробный README

## 📦 Файлы для деплоя:

```
simple-chat/
├── Dockerfile              # Для Docker деплоя
├── DEPLOYMENT.md          # Подробная инструкция для TimeWeb
├── README.md              # Документация проекта
├── .gitignore             # Игнорируемые файлы
├── .env.example           # Пример переменных окружения
└── src/                   # Исходный код
```

## 🎯 3 способа деплоя:

### 1️⃣ **Docker** (Самый простой)

```bash
# Собрать образ
docker build -t simple-chat .

# Запустить
docker run -d -p 3000:3000 --name simple-chat simple-chat
```

### 2️⃣ **VPS с PM2** (Классический)

```bash
# На сервере
npm install
npm run build
pm2 start npm --name "simple-chat" -- start
```

### 3️⃣ **Vercel** (Бесплатно, но нужна БД)

```bash
# Установить Vercel CLI
npm i -g vercel

# Деплой
vercel
```

## ⚡ Быстрый старт на TimeWeb VPS:

### 1. Создать сервер
- Зайдите в панель TimeWeb Cloud
- Серверы → Создать сервер
- Ubuntu 22.04, 1 ядро, 512MB RAM

### 2. Подключиться по SSH
```bash
ssh root@ваш-ip
```

### 3. Установить Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g pm2
```

### 4. Загрузить проект
```bash
# Через Git
git clone https://github.com/ваш-username/simple-chat.git
cd simple-chat

# Или через SCP с локального компьютера
# scp -r ./simple-chat root@ваш-ip:/var/www/
```

### 5. Запустить
```bash
npm install
npm run build
pm2 start npm --name "simple-chat" -- start
pm2 save
pm2 startup
```

### 6. Настроить Nginx
```bash
apt install -y nginx

cat > /etc/nginx/sites-available/simple-chat << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/simple-chat /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 7. Готово! 🎉

Откройте `http://ваш-ip` в браузере!

## 📊 Что дальше?

### Можно добавить:

1. **Базу данных** (PostgreSQL + Prisma)
   - Для синхронизации между устройствами
   - См. инструкцию в DEPLOYMENT.md

2. **Аутентификацию** (NextAuth.js)
   - Вход через Google/GitHub
   - Защита от анонимов

3. **HTTPS** (Let's Encrypt)
   - Бесплатный SSL сертификат
   - `certbot --nginx`

4. **Домен**
   - Красивое имя вместо IP
   - Настроить DNS записи

## 🆘 Если что-то пошло не так:

```bash
# Проверить статус приложения
pm2 status

# Посмотреть логи
pm2 logs simple-chat

# Перезапустить
pm2 restart simple-chat

# Проверить Nginx
systemctl status nginx
nginx -t
```

## 📞 Поддержка

- Инструкция: `DEPLOYMENT.md`
- Документация: `README.md`
- Официальная док Next.js: https://nextjs.org/docs

---

**Успешного деплоя! 🚀**

Ваш чат готов к работе!
