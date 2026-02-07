const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '8558474673:AAGayUvuxDfykd8JojHVdSv3IeUPgM4sa2k';
const WEB_APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.WEB_APP_URL || `http://localhost:${PORT}`;

// Initialize Telegram Bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Log startup info
console.log('🚀 Starting Telegram Bot Server...');
console.log('📱 Bot Token:', BOT_TOKEN.substring(0, 10) + '...');
console.log('🌐 Web App URL:', WEB_APP_URL);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (in production use database)
let services = {
    'Стрижки': [
        { id: 1, name: 'Женская стрижка', duration: 60, price: 2500 },
        { id: 2, name: 'Мужская стрижка', duration: 45, price: 1500 },
        { id: 3, name: 'Детская стрижка', duration: 30, price: 1000 }
    ],
    'Окрашивание': [
        { id: 4, name: 'Полное окрашивание', duration: 180, price: 5500 },
        { id: 5, name: 'Мелирование', duration: 150, price: 4500 },
        { id: 6, name: 'Тонирование', duration: 90, price: 3000 }
    ],
    'Ногтевой сервис': [
        { id: 7, name: 'Маникюр + покрытие', duration: 90, price: 2000 },
        { id: 8, name: 'Педикюр', duration: 60, price: 1800 },
        { id: 9, name: 'Наращивание ногтей', duration: 120, price: 3500 }
    ],
    'Уход': [
        { id: 10, name: 'Уход за лицом', duration: 60, price: 3000 },
        { id: 11, name: 'Массаж головы', duration: 30, price: 1500 },
        { id: 12, name: 'Восстановление волос', duration: 90, price: 3500 }
    ]
};

let masters = [
    { id: 1, name: 'Анна Иванова', specialty: 'Стилист-парикмахер', rating: 4.9, avatar: 'АИ', telegramId: 123456789 },
    { id: 2, name: 'Мария Петрова', specialty: 'Колорист', rating: 4.8, avatar: 'МП', telegramId: 987654321 },
    { id: 3, name: 'Елена Смирнова', specialty: 'Мастер маникюра', rating: 5.0, avatar: 'ЕС', telegramId: 555555555 },
    { id: 4, name: 'Ольга Козлова', specialty: 'Универсал', rating: 4.7, avatar: 'ОК', telegramId: 444444444 }
];

let appointments = [];
const ADMIN_IDS = [123456789]; // Replace with real admin Telegram IDs

// Telegram Bot Commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name;
    
    bot.sendMessage(chatId, 
        `Привет, ${userName}! 👋\n\n` +
        `Добро пожаловать в Салон Красоты! ✨\n\n` +
        `Нажмите на кнопку ниже, чтобы открыть приложение для записи.`,
        {
            reply_markup: {
                inline_keyboard: [[
                    { text: '📅 Записаться онлайн', web_app: { url: WEB_APP_URL } }
                ]]
            }
        }
    );
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        `🤖 Доступные команды:\n\n` +
        `/start - Открыть приложение для записи\n` +
        `/help - Помощь\n` +
        `/myappointments - Мои записи\n` +
        `/admin - Панель администратора (только для админов)`
    );
});

bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    if (ADMIN_IDS.includes(msg.from.id)) {
        bot.sendMessage(chatId,
            `⚙️ Административная панель\n\n` +
            `Используйте веб-приложение для управления услугами и мастерами.`,
            {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '⚙️ Открыть админ-панель', web_app: { url: WEB_APP_URL } }
                    ]]
                }
            }
        );
    } else {
        bot.sendMessage(chatId, '❌ У вас нет прав администратора.');
    }
});

// API Endpoints
app.get('/api/services', (req, res) => {
    res.json(services);
});

app.get('/api/masters', (req, res) => {
    res.json(masters);
});

app.post('/api/booking', async (req, res) => {
    const { service, master, date, time, userId, userName } = req.body;
    
    const appointment = {
        id: Date.now(),
        service,
        master,
        date,
        time,
        userId,
        userName,
        status: 'upcoming',
        createdAt: new Date()
    };
    
    appointments.push(appointment);
    
    // Send notification to master
    const masterData = masters.find(m => m.name === master);
    if (masterData && masterData.telegramId) {
        try {
            await bot.sendMessage(
                masterData.telegramId,
                `🔔 Новая запись!\n\n` +
                `👤 Клиент: ${userName}\n` +
                `💇‍♀️ Услуга: ${service}\n` +
                `📅 Дата: ${date}\n` +
                `⏰ Время: ${time}`
            );
        } catch (error) {
            console.error('Error sending notification to master:', error);
        }
    }
    
    // Send notification to admin
    for (const adminId of ADMIN_IDS) {
        try {
            await bot.sendMessage(
                adminId,
                `🔔 Новая запись в салоне!\n\n` +
                `👤 Клиент: ${userName}\n` +
                `💇‍♀️ Услуга: ${service}\n` +
                `👨‍💼 Мастер: ${master}\n` +
                `📅 Дата: ${date}\n` +
                `⏰ Время: ${time}`
            );
        } catch (error) {
            console.error('Error sending notification to admin:', error);
        }
    }
    
    res.json({ success: true, appointment });
});

app.get('/api/appointments/:userId', (req, res) => {
    const userAppointments = appointments.filter(apt => apt.userId === parseInt(req.params.userId));
    res.json(userAppointments);
});

// Admin endpoints
app.post('/api/admin/services', (req, res) => {
    const { category, service } = req.body;
    if (!services[category]) {
        services[category] = [];
    }
    service.id = Date.now();
    services[category].push(service);
    res.json({ success: true, service });
});

app.put('/api/admin/services/:category/:id', (req, res) => {
    const { category, id } = req.params;
    const updatedService = req.body;
    services[category] = services[category].map(s => 
        s.id === parseInt(id) ? { ...s, ...updatedService } : s
    );
    res.json({ success: true });
});

app.delete('/api/admin/services/:category/:id', (req, res) => {
    const { category, id } = req.params;
    services[category] = services[category].filter(s => s.id !== parseInt(id));
    res.json({ success: true });
});

app.post('/api/admin/masters', (req, res) => {
    const master = { ...req.body, id: Date.now(), rating: 5.0 };
    masters.push(master);
    res.json({ success: true, master });
});

app.put('/api/admin/masters/:id', (req, res) => {
    const { id } = req.params;
    masters = masters.map(m => m.id === parseInt(id) ? { ...m, ...req.body } : m);
    res.json({ success: true });
});

app.delete('/api/admin/masters/:id', (req, res) => {
    const { id } = req.params;
    masters = masters.filter(m => m.id !== parseInt(id));
    res.json({ success: true });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        bot: 'running',
        webAppUrl: WEB_APP_URL
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🤖 Telegram Bot started`);
    console.log(`📱 Bot username: @${bot.options.username || 'your_bot'}`);
});
