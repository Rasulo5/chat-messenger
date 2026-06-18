# 🚀 Развёртывание Simple Chat на TimeWeb Cloud

## 📋 Описание

Simple Chat - это лёгкий мессенджер который использует **localStorage** для хранения данных. 
**Важно:** Чат работает только в рамках одного браузера. Для общения между разными устройствами нужна база данных.

## 🎯 Варианты использования

### ✅ Подходит для:
- Демонстрации возможностей
- Личного использования в одном браузере
- Обучения и тестирования
- Внутреннего чата в организации (один компьютер)

### ❌ Не подходит для:
- Общения между разными устройствами
- Публичного мессенджера
- Коммерческого использования

---

## 🚀 Быстрый старт на TimeWeb Cloud

### Способ 1: VPS с Node.js (Рекомендуется)

#### 1. Создать VPS сервер
1. Зайдите в панель TimeWeb Cloud
2. Перейдите в раздел **"Серверы"** → **"Виртуальные серверы"**
3. Нажмите **"Создать сервер"**
4. Выберите:
   - **ОС:** Ubuntu 22.04 LTS
   - **Тариф:** Минимальный (1 ядро, 512MB RAM) ~150-200₽/мес
   - **Регион:** Ближайший к вам

#### 2. Подключиться по SSH
```bash
ssh root@ваш-ip-сервера
```

#### 3. Установить Node.js и зависимости
```bash
# Обновить пакеты
apt update && apt upgrade -y

# Установить Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Установить Git
apt install -y git

# Установить PM2 (менеджер процессов)
npm install -g pm2

# Установить Nginx
apt install -y nginx
```

#### 4. Загрузить проект
```bash
# Создать директорию
mkdir -p /var/www/simple-chat
cd /var/www/simple-chat

# Вариант A: Клонировать из Git (рекомендуется)
git clone https://github.com/ваш-username/simple-chat.git .

# Вариант B: Загрузить через SCP (если нет Git)
# На локальном компьютере:
# scp -r ./simple-chat/* root@ваш-ip:/var/www/simple-chat/
```

#### 5. Установить зависимости и собрать проект
```bash
# Установить зависимости
npm install

# Собрать проект
npm run build
```

#### 6. Запустить через PM2
```bash
# Запустить приложение
pm2 start npm --name "simple-chat" -- start

# Сохранить конфигурацию
pm2 save

# Настроить автозапуск при загрузке
pm2 startup
# Выполните команду которую выведет pm2 startup
```

#### 7. Настроить Nginx
```bash
# Создать конфигурационный файл
nano /etc/nginx/sites-available/simple-chat
```

Вставьте конфигурацию:
```nginx
server {
    listen 80;
    server_name ваш-домен.com;  # Или IP адрес

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Кэширование статических файлов
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Кэшировать на 1 год
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Сохраните (Ctrl+O, Enter) и выйдите (Ctrl+X)

```bash
# Включить сайт
ln -s /etc/nginx/sites-available/simple-chat /etc/nginx/sites-enabled/

# Удалить дефолтный сайт
rm /etc/nginx/sites-enabled/default

# Проверить конфигурацию
nginx -t

# Перезапустить Nginx
systemctl restart nginx
```

#### 8. Открыть порты в фаерволе
```bash
# Установить UFW
apt install -y ufw

# Разрешить SSH
ufw allow ssh

# Разрешить HTTP/HTTPS
ufw allow http
ufw allow https

# Включить фаервол
ufw enable
```

#### 9. Готово!
Откройте в браузере: `http://ваш-ip-сервера` или `http://ваш-домен.com`

---

### Способ 2: Docker (Проще, но требует больше ресурсов)

#### 1. Установить Docker на VPS
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

#### 2. Создать Dockerfile
Уже есть в проекте (см. ниже)

#### 3. Собрать и запустить
```bash
cd /var/www/simple-chat

# Собрать образ
docker build -t simple-chat .

# Запустить контейнер
docker run -d -p 3000:3000 --name simple-chat simple-chat

# Автозапуск при загрузке
docker update --restart=always simple-chat
```

---

## 📁 Структура проекта

```
simple-chat/
├── src/
│   └── app/
│       ├── page.tsx          # Главная страница (вход)
│       ├── chat/page.tsx     # Страница чата
│       ├── layout.tsx        # Основной layout
│       └── globals.css       # Глобальные стили
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🔧 Управление приложением

### PM2 команды:
```bash
# Посмотреть статус
pm2 status

# Посмотреть логи
pm2 logs simple-chat

# Перезапустить
pm2 restart simple-chat

# Остановить
pm2 stop simple-chat

# Удалить
pm2 delete simple-chat
```

### Nginx команды:
```bash
# Проверить статус
systemctl status nginx

# Перезапустить
systemctl restart nginx

# Перезагрузить конфигурацию
systemctl reload nginx

# Посмотреть логи
tail -f /var/log/nginx/error.log
```

---

## 🌐 Настройка домена (опционально)

#### 1. Купить домен
- TimeWeb Domain
- Reg.ru
- Nic.ru

#### 2. Настроить DNS
В панели регистратора домена создайте A-запись:
```
Тип: A
Имя: @
Значение: ваш-ip-сервера
TTL: 3600
```

#### 3. Обновить Nginx
В файле `/etc/nginx/sites-available/simple-chat` замените IP на домен:
```nginx
server_name ваш-домен.com;
```

Перезапустите Nginx:
```bash
systemctl reload nginx
```

#### 4. Настроить HTTPS (Let's Encrypt)
```bash
# Установить Certbot
apt install -y certbot python3-certbot-nginx

# Получить сертификат
certbot --nginx -d ваш-домен.com

# Автообновление сертификата
certbot renew --dry-run
```

---

## 📊 Мониторинг

### Установить мониторинг PM2:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Uptime мониторинг:
- [UptimeRobot](https://uptimerobot.com/) - бесплатно
- [Pingdom](https://www.pingdom.com/) - платно

---

## ⚠️ Важные замечания

1. **localStorage ограничения:**
   - Данные хранятся только в браузере клиента
   - Нет синхронизации между устройствами
   - Данные теряются при очистке кэша браузера

2. **Безопасность:**
   - Нет аутентификации (любой может войти)
   - Нет шифрования сообщений
   - Не используйте для конфиденциальных данных

3. **Производительность:**
   - Максимум ~5-10 активных пользователей на одном сервере
   - При большей нагрузке нужна оптимизация

---

## 🆘 Troubleshooting

### Ошибка: "PORT 3000 is already in use"
```bash
# Найти процесс
lsof -i :3000

# Убить процесс
kill -9 <PID>

# Или изменить порт в PM2
pm2 start npm --name "simple-chat" -- start -- -p 3001
```

### Ошибка: "Cannot find module"
```bash
cd /var/www/simple-chat
npm install
npm run build
pm2 restart simple-chat
```

### Nginx не запускается
```bash
# Проверить конфигурацию
nginx -t

# Посмотреть логи
journalctl -u nginx -f
```

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи: `pm2 logs simple-chat`
2. Проверьте статус: `pm2 status`
3. Проверьте Nginx: `systemctl status nginx`

---

## 🎉 Готово!

Ваш чат работает! Откройте браузер и наслаждайтесь! 🚀

**Следующие шаги:**
- Настроить домен
- Включить HTTPS
- Добавить мониторинг
- Настроить резервное копирование
