#!/bin/bash

# Автоматическое развертывание Salon Telegram Bot
# Поддерживает: Render.com, Railway.app, Fly.io

set -e

echo "🚀 Автоматическое развертывание Salon Telegram Bot"
echo "=================================================="
echo ""

BOT_TOKEN="8558474673:AAGayUvuxDfykd8JojHVdSv3IeUPgM4sa2k"
APP_NAME="salon-telegram-bot"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js не установлен!"
        echo "Установите Node.js: https://nodejs.org/"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm не установлен!"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "Git не установлен!"
        echo "Установите Git: https://git-scm.com/"
        exit 1
    fi
    
    log_info "Все зависимости установлены"
}

# Установка зависимостей проекта
install_project_deps() {
    log_info "Установка зависимостей проекта..."
    npm install
    log_info "Зависимости установлены"
}

# Тестовый запуск локально
test_local() {
    log_info "Запуск тестового сервера..."
    echo ""
    echo "Сервер запускается на http://localhost:3000"
    echo "Нажмите Ctrl+C для остановки"
    echo ""
    
    export BOT_TOKEN="$BOT_TOKEN"
    export NODE_ENV="development"
    
    node server.js
}

# Развертывание на Render.com через CLI
deploy_render() {
    log_info "Развертывание на Render.com..."
    
    # Проверка наличия render CLI
    if ! command -v render &> /dev/null; then
        log_warning "Render CLI не установлен. Устанавливаю..."
        npm install -g @render/cli 2>/dev/null || {
            log_error "Не удалось установить Render CLI"
            log_info "Пожалуйста, установите вручную: npm install -g @render/cli"
            return 1
        }
    fi
    
    log_info "Создание нового сервиса на Render.com..."
    log_warning "Откроется браузер для авторизации на Render.com"
    
    render login
    render create web "$APP_NAME" \
        --env nodejs \
        --buildCommand "npm install" \
        --startCommand "node server.js" \
        --envVar "BOT_TOKEN=$BOT_TOKEN" \
        --envVar "NODE_ENV=production"
    
    log_info "Развертывание завершено!"
}

# Развертывание на Railway.app
deploy_railway() {
    log_info "Развертывание на Railway.app..."
    
    # Проверка Railway CLI
    if ! command -v railway &> /dev/null; then
        log_warning "Railway CLI не установлен. Устанавливаю..."
        npm install -g @railway/cli || {
            log_error "Не удалось установить Railway CLI"
            log_info "Установите вручную: npm install -g @railway/cli"
            return 1
        }
    fi
    
    log_info "Авторизация в Railway..."
    railway login
    
    log_info "Создание проекта..."
    railway init
    
    log_info "Установка переменных окружения..."
    railway variables set BOT_TOKEN="$BOT_TOKEN"
    railway variables set NODE_ENV="production"
    
    log_info "Развертывание приложения..."
    railway up
    
    log_info "Получение URL..."
    railway domain
    
    log_info "Развертывание на Railway завершено!"
}

# Развертывание на Fly.io
deploy_fly() {
    log_info "Развертывание на Fly.io..."
    
    # Проверка Fly CLI
    if ! command -v flyctl &> /dev/null; then
        log_warning "Fly CLI не установлен. Устанавливаю..."
        curl -L https://fly.io/install.sh | sh || {
            log_error "Не удалось установить Fly CLI"
            return 1
        }
        export FLYCTL_INSTALL="$HOME/.fly"
        export PATH="$FLYCTL_INSTALL/bin:$PATH"
    fi
    
    log_info "Авторизация в Fly.io..."
    flyctl auth login
    
    log_info "Создание приложения..."
    flyctl launch --name "$APP_NAME" --no-deploy
    
    log_info "Установка переменных окружения..."
    flyctl secrets set BOT_TOKEN="$BOT_TOKEN"
    
    log_info "Развертывание..."
    flyctl deploy
    
    log_info "Развертывание на Fly.io завершено!"
}

# Создание GitHub репозитория и push
setup_github() {
    log_info "Настройка Git репозитория..."
    
    if [ ! -d .git ]; then
        git init
        git add .
        git commit -m "Initial commit: Beauty Salon Telegram Bot"
        log_info "Git репозиторий инициализирован"
    else
        log_info "Git репозиторий уже существует"
    fi
    
    echo ""
    log_warning "Для завершения настройки GitHub:"
    echo "1. Создайте репозиторий на https://github.com/new"
    echo "2. Выполните команды:"
    echo ""
    echo "   git remote add origin https://github.com/YOUR_USERNAME/$APP_NAME.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
}

# Главное меню
show_menu() {
    echo ""
    echo "Выберите платформу для развертывания:"
    echo ""
    echo "1) Render.com (рекомендуется - бесплатно, 750 часов/мес)"
    echo "2) Railway.app (бесплатно, \$5 кредитов/мес)"
    echo "3) Fly.io (бесплатно, требует карту)"
    echo "4) Тестовый запуск локально"
    echo "5) Только настроить GitHub"
    echo "0) Выход"
    echo ""
    read -p "Ваш выбор: " choice
    
    case $choice in
        1)
            install_project_deps
            deploy_render
            ;;
        2)
            install_project_deps
            deploy_railway
            ;;
        3)
            install_project_deps
            deploy_fly
            ;;
        4)
            install_project_deps
            test_local
            ;;
        5)
            setup_github
            ;;
        0)
            log_info "Выход"
            exit 0
            ;;
        *)
            log_error "Неверный выбор"
            show_menu
            ;;
    esac
}

# Основная логика
main() {
    check_dependencies
    
    echo ""
    log_info "Текущая директория: $(pwd)"
    log_info "Bot Token: ${BOT_TOKEN:0:15}..."
    
    # Проверка структуры файлов
    if [ ! -f "server.js" ] || [ ! -f "package.json" ] || [ ! -d "public" ]; then
        log_error "Отсутствуют необходимые файлы!"
        log_info "Убедитесь, что вы находитесь в директории проекта"
        exit 1
    fi
    
    log_info "Структура проекта проверена"
    
    show_menu
    
    echo ""
    echo "=================================================="
    log_info "Развертывание завершено!"
    echo ""
    echo "📱 Следующие шаги:"
    echo "1. Откройте @BotFather в Telegram"
    echo "2. /mybots → выберите бота"
    echo "3. Bot Settings → Menu Button"
    echo "4. Вставьте URL вашего приложения"
    echo ""
    echo "🎉 Готово! Проверьте бота в Telegram"
    echo "=================================================="
}

# Запуск
main
