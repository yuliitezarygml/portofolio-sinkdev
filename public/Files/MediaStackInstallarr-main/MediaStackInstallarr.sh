#!/bin/bash

# ==============================================================================
# MediaStackInstallarr
# ==============================================================================

# --- Конфигурация и Глобальные переменные ---
readonly SCRIPT_VERSION="v0.9.0"
readonly LOG_FILE="mediastack_installer.log"

# Авторы и контакты
readonly DEV_NAME="I'm Sleger"
readonly DEV_TG="https://t.me/imsleger"
readonly DEV_TT="https://www.tiktok.com/@im_sleger"
readonly SUPPORT_NAME="Rusty"
readonly THANKS_NAME="zxcOvosh"

# Реквизиты для поддержки
readonly DONATION_TON="UQDrq9LzOFUmco_6vQ4tVYnxeldw-P5TD06Oul81_LR73GSL"
readonly DONATION_USDT_TRC20="TQAmBXnQYjvcRGtqmF6SzVYrc5V26o2gZd"
readonly DONATION_USDT_TON="UQDrq9LzOFUmco_6vQ4tVYnxeldw-P5TD06Oul81_LR73GSL"
readonly DONATION_TINKOFF="https://www.tinkoff.ru/rm/r_IrtpoHsetP.MeMNpRJyJH/h2RqH10598"

# Цвета
C_RESET='\033[0m'; C_BLUE='\033[0;34m'; C_GREEN='\033[0;32m'
C_YELLOW='\033[1;33m'; C_CYAN='\033[0;36m'; C_RED='\033[0;31m'

# Системные переменные
OS_ID=""; PKG_MANAGER=""; INSTALL_CMD=""; UPDATE_CMD=""
COMPOSE_CMD=""; DNS_CONFIG=""; MEDIA_STACK_JUST_INSTALLED=false

# --- Система обработки ошибок ---
>"$LOG_FILE"
handle_error() {
    local error_code=$1 error_message=$2 exit_code=${3:-1}
    local full_message="Критическая ошибка [E${error_code}]: ${error_message}"
    print_color "$C_RED" "\n$full_message\nРабота скрипта прервана. Подробности в лог-файле: $LOG_FILE"
    echo "$(date): E${error_code}: ${error_message}" >> "$LOG_FILE"
    exit "$exit_code"
}
trap 'handle_error 999 "Непредвиденная ошибка на строке $LINENO. Проверьте лог."' ERR

# --- Функции-помощники ---
print_color() { echo -e "${1}${2}${C_RESET}"; }
print_header() { print_color "$C_BLUE" "==================================================================="; print_color "$C_CYAN" " $1"; print_color "$C_BLUE" "==================================================================="; echo; }

get_port() {
    local service_name=$1; local default_port=$2; local chosen_port
    local prompt_text; local is_busy=0

    if ss -tln | grep -q ":${default_port}\b"; then
        is_busy=1
        whiptail --title "Порт занят" --msgbox "Порт ${default_port} для '${service_name}' уже используется. Вам нужно будет выбрать другой." 10 78
        prompt_text="Введите НОВЫЙ порт для '${service_name}' (1024-65535):"; default_port=""
    else
        prompt_text="Введите порт для '${service_name}' (Enter для ${default_port}):"
    fi

    while true; do
        chosen_port=$(whiptail --inputbox "$prompt_text" 10 78 "$default_port" 3>&1 1>&2 2>&3)
        if [ $? -ne 0 ]; then handle_error 303 "Выбор порта был отменен." 0; fi

        if [ -z "$chosen_port" ]; then
            if [ $is_busy -eq 1 ]; then whiptail --msgbox "Поле не может быть пустым. Введите свободный порт." 10 78; continue
            else chosen_port=$2; fi
        fi

        if ! [[ $chosen_port =~ ^[0-9]+$ ]] || [ "$chosen_port" -le 1023 ] || [ "$chosen_port" -gt 65535 ]; then
            whiptail --msgbox "Неверный формат. Введите число от 1024 до 65535." 10 78; continue
        fi

        if [ "$chosen_port" -ne "$2" ] && ss -tln | grep -q ":${chosen_port}\b"; then
            whiptail --msgbox "Порт ${chosen_port} тоже занят. Пожалуйста, выберите другой." 10 78; continue
        fi
        
        break
    done
    echo "$chosen_port"
}

# --- Функции-генераторы сервисов для docker-compose ---
generate_dns_section() { [ -n "$DNS_CONFIG" ] && echo "    dns: [\"9.9.9.9\", \"1.1.1.1\"]"; }

generate_service_flaresolverr() { cat <<EOF
  flaresolverr:
    image: ghcr.io/flaresolverr/flaresolverr:latest
    container_name: flaresolverr
    environment:
      - LOG_LEVEL=info
      - TZ=\${TZ}
    restart: unless-stopped
$(generate_dns_section)
EOF
}
generate_service_prowlarr() { cat <<EOF
  prowlarr:
    image: lscr.io/linuxserver/prowlarr:latest
    container_name: prowlarr
    environment:
      - PUID=\${PUID}
      - PGID=\${PGID}
      - TZ=\${TZ}
    volumes:
      - \${DOCKER_CONFIG_PATH}/prowlarr:/config
    ports:
      - "\${PROWLARR_PORT}:9696"
    restart: unless-stopped
$(generate_dns_section)
EOF
}
generate_service_qbittorrent() { cat <<EOF
  qbittorrent:
    image: lscr.io/linuxserver/qbittorrent:latest
    container_name: qbittorrent
    environment:
      - PUID=\${PUID}
      - PGID=\${PGID}
      - TZ=\${TZ}
      - WEBUI_PORT=8080
    volumes:
      - \${DOCKER_CONFIG_PATH}/qbittorrent:/config
      - \${MEDIA_PATH_DOWNLOADS}:/downloads
    ports:
      - "\${QBITTORRENT_PORT}:8080"
      - "6881:6881"
      - "6881:6881/udp"
    restart: unless-stopped
$(generate_dns_section)
EOF
}
generate_service_sonarr() { cat <<EOF
  sonarr:
    image: lscr.io/linuxserver/sonarr:latest
    container_name: sonarr
    environment:
      - PUID=\${PUID}
      - PGID=\${PGID}
      - TZ=\${TZ}
    volumes:
      - \${DOCKER_CONFIG_PATH}/sonarr:/config
      - \${MEDIA_PATH_SERIES}:/tv
      - \${MEDIA_PATH_DOWNLOADS}:/downloads
    ports:
      - "\${SONARR_PORT}:8989"
    restart: unless-stopped
$(generate_dns_section)
EOF
}
generate_service_radarr() { cat <<EOF
  radarr:
    image: lscr.io/linuxserver/radarr:latest
    container_name: radarr
    environment:
      - PUID=\${PUID}
      - PGID=\${PGID}
      - TZ=\${TZ}
    volumes:
      - \${DOCKER_CONFIG_PATH}/radarr:/config
      - \${MEDIA_PATH_MOVIES}:/movies
      - \${MEDIA_PATH_DOWNLOADS}:/downloads
    ports:
      - "\${RADARR_PORT}:7878"
    restart: unless-stopped
$(generate_dns_section)
EOF
}
generate_service_jellyfin() { local ip_addr; ip_addr=$(hostname -I | awk '{print $1}'); cat <<EOF
  jellyfin:
    image: lscr.io/linuxserver/jellyfin:latest
    container_name: jellyfin
    environment:
      - PUID=\${PUID}
      - PGID=\${PGID}
      - TZ=\${TZ}
      - JELLYFIN_PublishedServerUrl=${ip_addr}
    volumes:
      - \${DOCKER_CONFIG_PATH}/jellyfin:/config
      - \${MEDIA_PATH_SERIES}:/data/tvshows
      - \${MEDIA_PATH_MOVIES}:/data/movies
    ports:
      - "\${JELLYFIN_PORT}:8096"
    restart: unless-stopped
$(generate_dns_section)
EOF
}
generate_service_jellyseerr() { cat <<EOF
  jellyseerr:
    image: fallenbagel/jellyseerr:latest
    container_name: jellyseerr
    environment:
      - LOG_LEVEL=info
      - TZ=\${TZ}
    volumes:
      - \${DOCKER_CONFIG_PATH}/jellyseerr:/app/config
    ports:
      - "\${JELLYSEERR_PORT}:5055"
    restart: unless-stopped
$(generate_dns_section)
EOF
}
generate_service_homarr() { cat <<EOF
  homarr:
    image: ghcr.io/ajnart/homarr:latest
    container_name: homarr
    restart: unless-stopped
    volumes:
      - \${DOCKER_CONFIG_PATH}/homarr/configs:/app/data/configs
      - \${DOCKER_CONFIG_PATH}/homarr/icons:/app/public/icons
    ports:
      - "\${HOMARR_PORT}:7575"
$(generate_dns_section)
EOF
}
generate_service_bazarr() { cat <<EOF
  bazarr:
    image: lscr.io/linuxserver/bazarr:latest
    container_name: bazarr
    environment:
      - PUID=\${PUID}
      - PGID=\${PGID}
      - TZ=\${TZ}
    volumes:
      - \${DOCKER_CONFIG_PATH}/bazarr:/config
      - \${MEDIA_PATH_MOVIES}:/movies
      - \${MEDIA_PATH_SERIES}:/tv
    ports:
      - "\${BAZARR_PORT}:6767"
    restart: unless-stopped
$(generate_dns_section)
EOF
}
generate_service_dashdot() { cat <<EOF
  dashdot:
    image: mauricenino/dashdot:latest
    container_name: dashdot
    restart: unless-stopped
    privileged: true
    ports:
      - "\${DASHDOT_PORT}:3001"
    volumes:
      - /:/mnt/host:ro
EOF
}

# --- Функция пост-установки (только для qBittorrent) ---
run_post_install_config() {
    if [ -f "$DOCKER_CONFIG_PATH/.env" ]; then export $(grep -v '^#' "$DOCKER_CONFIG_PATH/.env" | xargs);
    else return 0; fi
    
    local host_ip; host_ip=$(hostname -I | awk '{print $1}')
    if [ -z "$host_ip" ]; then return 0; fi

    print_header "Пост-установка: Настройка qBittorrent"
    
    whiptail --title "Настройка qBittorrent" --msgbox "Сейчас скрипт автоматически сменит временный пароль qBittorrent на новый, безопасный." 10 78
    
    # Ожидание запуска веб-интерфейса
    local qbit_url="http://${host_ip}:${QBITTORRENT_PORT}/"
    local timeout=120
    print_color "$C_YELLOW" "Ожидание запуска web-интерфейса qBittorrent..."
    until curl -s -L -o /dev/null -w "%{http_code}" "$qbit_url" | grep -qE "200|403"; do
        sleep 3; timeout=$((timeout - 3))
        if [ $timeout -le 0 ]; then print_color "$C_RED" "qBittorrent не запустился. Пропускаем смену пароля."; return 1; fi
    done
    print_color "$C_GREEN" "Web-интерфейс qBittorrent запущен."

    # Извлечение временного пароля
    print_color "$C_YELLOW" "Извлечение временного пароля qBittorrent..."
    local temp_qbit_password=""
    for i in {1..15}; do
        temp_qbit_password=$(docker logs qbittorrent 2>&1 | grep -oP "temporary password is provided for this session:\s*\K\S+" || true)
        if [ -n "$temp_qbit_password" ]; then break; fi
        sleep 2
    done
    if [ -z "$temp_qbit_password" ]; then print_color "$C_RED" "Не удалось извлечь временный пароль. Пропускаем смену пароля."; return 1; fi
    print_color "$C_GREEN" "Временный пароль успешно получен."

    # Получение сессии
    local qbit_sid; qbit_sid=""; local cookie_jar; cookie_jar=$(mktemp)
    for i in {1..10}; do
        curl -s -L -c "$cookie_jar" "$qbit_url" > /dev/null
        local login_response_headers; login_response_headers=$(curl -i -s -L -b "$cookie_jar" --header "Referer: $qbit_url" --data-urlencode "username=admin" --data-urlencode "password=${temp_qbit_password}" "${qbit_url}api/v2/auth/login")
        qbit_sid=$(echo "$login_response_headers" | grep -oP 'SID=\K[^;]*' || true)
        if [ -n "$qbit_sid" ]; then break; fi
        sleep 3
    done
    rm -f "$cookie_jar"
    if [ -z "$qbit_sid" ]; then print_color "$C_RED" "Не удалось получить сессию. Пропускаем смену пароля."; return 1; fi
    
    # Смена пароля
    local new_qbit_password; new_qbit_password=$(openssl rand -base64 12)
    curl -s -f -X POST --cookie "SID=${qbit_sid}" --data-urlencode "json={\"web_ui_password\": \"${new_qbit_password}\", \"web_ui_username\": \"admin\"}" "${qbit_url}api/v2/app/setPreferences" > /dev/null
    
    whiptail --title "ВАЖНО: Пароль qBittorrent" --msgbox "Пароль для qBittorrent (логин: admin) был успешно изменен на:\n\n${new_qbit_password}\n\nСохраните его!" 12 78
}

# --- Основные Блоки Скрипта ---

detect_and_prepare_system() {
    print_header "Блок 0: Определение и подготовка системы"
    if [ "$EUID" -ne 0 ]; then handle_error 101 "Скрипт должен быть запущен с правами root или через sudo."; fi
    if [ -f /etc/os-release ]; then . /etc/os-release; OS_ID=$ID; else handle_error 102 "/etc/os-release не найден."; fi
    local deps; case "$OS_ID" in
        ubuntu|debian) PKG_MANAGER="apt-get"; UPDATE_CMD="apt-get update"; INSTALL_CMD="apt-get install -y"; deps="curl git jq whiptail ca-certificates net-tools";;
        fedora) PKG_MANAGER="dnf"; UPDATE_CMD="dnf check-update"; INSTALL_CMD="dnf install -y"; deps="curl git jq newt net-tools";;
        arch) PKG_MANAGER="pacman"; UPDATE_CMD="pacman -Syy"; INSTALL_CMD="pacman -S --noconfirm"; deps="curl git jq libnewt net-tools";;
        *) handle_error 103 "Ваш дистрибутив '$OS_ID' пока не поддерживается.";;
    esac
    print_color "$C_YELLOW" "Определена система: $OS_ID. Проверяем зависимости..."; NEEDS_INSTALL=0
    for dep in $deps; do
        if ! command -v "$dep" &>/dev/null && ! (pacman -Q "$dep" &>/dev/null) && ! (rpm -q "$dep" &>/dev/null); then NEEDS_INSTALL=1; break; fi
    done
    if [ $NEEDS_INSTALL -eq 1 ]; then
        print_color "$C_YELLOW" "Устанавливаем: $deps..."; $UPDATE_CMD &>> "$LOG_FILE"
        $INSTALL_CMD $deps &>> "$LOG_FILE" || handle_error 104 "Не удалось установить базовые зависимости."
    fi
    print_color "$C_GREEN" "Все зависимости установлены."; echo
}

check_and_set_compose() {
    if docker compose version &>/dev/null; then COMPOSE_CMD="docker compose"; print_color "$C_GREEN" "Обнаружен Docker Compose v2."; return 0; fi
    if docker-compose --version &>/dev/null; then COMPOSE_CMD="docker-compose"; print_color "$C_GREEN" "Обнаружен Docker Compose v1."; return 0; fi
    print_color "$C_RED" "Docker Compose не найден!"
    if (whiptail --title "Установка Docker Compose" --yesno "Хотите установить плагин Docker Compose v2 (рекомендуется)?" 10 78); then
        print_color "$C_YELLOW" "Устанавливаем docker-compose-plugin..."; $INSTALL_CMD docker-compose-plugin &>> "$LOG_FILE" || handle_error 210 "Не удалось установить плагин Docker Compose."
        COMPOSE_CMD="docker compose"; print_color "$C_GREEN" "Плагин Docker Compose v2 успешно установлен."
    else handle_error 211 "Установка отменена. Скрипт не может продолжать без Docker Compose." 0; fi
}

install_docker() {
    print_header "Блок 1: Установка Docker и Docker Compose"
    if command -v docker &>/dev/null; then print_color "$C_GREEN" "Docker уже установлен."; check_and_set_compose; echo; return 0; fi
    local choice; choice=$(whiptail --title "Способ установки Docker" --menu "Выберите, как установить Docker:" 15 78 2 "1" "Нативный (репозиторий Docker) - Рекомендуется" "2" "Официальный скрипт (get.docker.com) - Быстро" 3>&1 1>&2 2>&3)
    case "$choice" in
        1)
            print_color "$C_YELLOW" "Устанавливаем Docker через нативный репозиторий..."; case "$OS_ID" in
                ubuntu|debian) install -m 0755 -d /etc/apt/keyrings; curl -fsSL https://download.docker.com/linux/${OS_ID}/gpg -o /etc/apt/keyrings/docker.asc; chmod a+r /etc/apt/keyrings/docker.asc
                    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${OS_ID} $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null; $UPDATE_CMD &>> "$LOG_FILE";;
                fedora) dnf -y install dnf-plugins-core &>> "$LOG_FILE"; dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo &>> "$LOG_FILE";;
            esac
            $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin &>> "$LOG_FILE" || handle_error 201 "Ошибка нативной установки Docker."
            ;;
        2)
            print_color "$C_YELLOW" "Устанавливаем Docker через официальный скрипт..."; curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh &>> "$LOG_FILE" || handle_error 202 "Ошибка при выполнении официального скрипта Docker."; rm get-docker.sh
            ;;
        *) whiptail --title "Отмена" --msgbox "Установка Docker отменена." 10 78; exit 0;;
    esac
    systemctl start docker || handle_error 203 "Не удалось запустить службу Docker."; systemctl enable docker &> /dev/null
    usermod -aG docker "$SUDO_USER"; print_color "$C_GREEN" "Docker успешно установлен!"
    print_color "$C_YELLOW" "ВАЖНО: Чтобы использовать Docker без 'sudo', вам необходимо перелогиниться."; check_and_set_compose; echo
}

install_docker_tools() {
    print_header "Блок 2: Установка утилит для управления Docker"
    local message=""; local options=()
    if docker ps -a --format '{{.Names}}' | grep -q "^portainer$"; then
        local existing_port; existing_port=$(docker port portainer 9000/tcp 2>/dev/null | awk -F: '{print $2}')
        if [ -n "$existing_port" ]; then PORTAINER_URL="http://$(hostname -I | awk '{print $1}'):${existing_port}"; message+="Portainer уже обнаружен. Адрес: ${PORTAINER_URL}\n";
        else message+="Portainer уже обнаружен (порт не опубликован).\n"; fi
    else options+=("Portainer" "Веб-интерфейс для Docker" "ON"); fi
    if docker ps -a --format '{{.Names}}' | grep -q "^watchtower$"; then message+="Watchtower уже обнаружен.\n";
    else options+=("Watchtower" "Автообновление контейнеров" "OFF"); fi
    if [ ${#options[@]} -eq 0 ]; then print_color "$C_GREEN" "Все утилиты (Portainer, Watchtower) уже установлены. Пропускаем шаг."; echo; return 0; fi

    local choices; choices=$(whiptail --title "Утилиты Docker" --checklist "${message}\nВыберите утилиты для установки.\n[Пробел] - выбрать/снять, [Enter] - продолжить." 20 78 4 "${options[@]}" 3>&1 1>&2 2>&3)
    if [ -z "$choices" ]; then print_color "$C_YELLOW" "Установка утилит пропущена."; echo; return 0; fi

    local tools_path; tools_path=$(whiptail --inputbox "Введите путь для утилит Docker:" 10 78 "/opt/docker-tools" --title "Путь для утилит" 3>&1 1>&2 2>&3)
    mkdir -p "$tools_path" || handle_error 301 "Не удалось создать директорию для утилит: $tools_path"
    local compose_file="$tools_path/docker-compose.yml"
    echo "version: '3.8'" > "$compose_file"; echo "services:" >> "$compose_file"
    if [[ $choices == *"Portainer"* ]]; then
        local portainer_port; portainer_port=$(get_port "Portainer" "9000")
        local portainer_edge_port; portainer_edge_port=$(get_port "Portainer Edge" "8000")
        cat <<EOF >> "$compose_file"
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    security_opt: [no-new-privileges:true]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./portainer_data:/data
    ports:
      - "${portainer_port}:9000"
      - "${portainer_edge_port}:8000"
EOF
        PORTAINER_URL="http://$(hostname -I | awk '{print $1}'):${portainer_port}"
    fi
    if [[ $choices == *"Watchtower"* ]]; then
        cat <<EOF >> "$compose_file"
  watchtower:
    image: containrrr/watchtower:latest
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --schedule '0 0 4 * * *' --cleanup
EOF
    fi
    print_color "$C_YELLOW" "Запускаем утилиты..."; (cd "$tools_path" && $COMPOSE_CMD up -d) &>> "$LOG_FILE" || handle_error 402 "Не удалось запустить утилиты Docker."
    print_color "$C_GREEN" "Утилиты успешно запущены!"; echo
}

install_media_stack() {
    print_header "Блок 3: Развертывание медиа-стека"
    DOCKER_CONFIG_PATH=$(whiptail --inputbox "Укажите базовый путь для конфигов медиа-стека:" 10 78 "$HOME/docker/media-stack" --title "Путь для конфигов" 3>&1 1>&2 2>&3)
    if [ $? -ne 0 ]; then print_color "$C_YELLOW" "Установка медиа-стека отменена."; return 0; fi

    if [ -f "$DOCKER_CONFIG_PATH/docker-compose.yml" ]; then
        whiptail --title "Стек уже установлен" --msgbox "Обнаружен файл docker-compose.yml в каталоге:\n$DOCKER_CONFIG_PATH\n\nСкрипт предполагает, что медиа-стек уже установлен. Этот блок будет пропущен." 12 78
        return 0
    fi
    
    print_color "$C_YELLOW" "Проверяем доступность api.themoviedb.org..."
    if ! ping -c 1 api.themoviedb.org &> /dev/null; then
        if (whiptail --title "Проблема с доступом" --yesno "Не удалось подключиться к api.themoviedb.org (вероятно, из-за блокировок).\n\nХотите автоматически добавить публичный DNS (9.9.9.9) во все контейнеры медиа-стека?" 12 78); then
            DNS_CONFIG="yes"; print_color "$C_GREEN" "Альтернативный DNS будет использован."
        else print_color "$C_RED" "Продолжаем без изменения DNS. Radarr/Sonarr могут работать некорректно."; fi
    else print_color "$C_GREEN" "Доступ к api.themoviedb.org есть."; fi; echo
    
    local path_choice; path_choice=$(whiptail --title "Настройка путей для медиа" --menu "Выберите режим настройки путей:" 15 78 2 "1" "Простой (указать 1 базовую папку)" "2" "Продвинутый (указать каждую папку отдельно)" 3>&1 1>&2 2>&3)
    case "$path_choice" in
        1)
            local base_media_path; base_media_path=$(whiptail --inputbox "Введите единый базовый путь для всех медиафайлов:" 10 78 "$HOME/media" --title "Простой режим" 3>&1 1>&2 2>&3)
            MEDIA_PATH_DOWNLOADS="${base_media_path}/downloads"; MEDIA_PATH_MOVIES="${base_media_path}/movies"; MEDIA_PATH_SERIES="${base_media_path}/series"
            ;;
        2)
            MEDIA_PATH_DOWNLOADS=$(whiptail --inputbox "Путь для загрузок:" 10 78 "$HOME/media/downloads" --title "Продвинутый режим" 3>&1 1>&2 2>&3)
            MEDIA_PATH_MOVIES=$(whiptail --inputbox "Путь для фильмов:" 10 78 "$HOME/media/movies" --title "Продвинутый режим" 3>&1 1>&2 2>&3)
            MEDIA_PATH_SERIES=$(whiptail --inputbox "Путь для сериалов:" 10 78 "$HOME/media/series" --title "Продвинутый режим" 3>&1 1>&2 2>&3)
            ;;
        *) print_color "$C_YELLOW" "Настройка путей отменена."; return 0;;
    esac

    print_color "$C_YELLOW" "Проверяем и настраиваем порты для сервисов..."
    JELLYFIN_PORT=$(get_port "Jellyfin" "8096"); JELLYSEERR_PORT=$(get_port "Jellyseerr" "5055")
    SONARR_PORT=$(get_port "Sonarr" "8989"); RADARR_PORT=$(get_port "Radarr" "7878")
    PROWLARR_PORT=$(get_port "Prowlarr" "9696"); QBITTORRENT_PORT=$(get_port "qBittorrent" "8080")
    
    mkdir -p "$DOCKER_CONFIG_PATH" "$MEDIA_PATH_DOWNLOADS" "$MEDIA_PATH_MOVIES" "$MEDIA_PATH_SERIES" || handle_error 301 "Не удалось создать директории для медиа."
    local env_file="$DOCKER_CONFIG_PATH/.env"
    {
        echo "PUID=$(id -u "$SUDO_USER")"; echo "PGID=$(id -g "$SUDO_USER")"
        echo "TZ=$(cat /etc/timezone 2>/dev/null || timedatectl | grep "Time zone" | awk '{print $3}')"
        echo "DOCKER_CONFIG_PATH=${DOCKER_CONFIG_PATH}"; echo "MEDIA_PATH_DOWNLOADS=${MEDIA_PATH_DOWNLOADS}"
        echo "MEDIA_PATH_MOVIES=${MEDIA_PATH_MOVIES}"; echo "MEDIA_PATH_SERIES=${MEDIA_PATH_SERIES}"
        echo "JELLYFIN_PORT=${JELLYFIN_PORT}"; echo "JELLYSEERR_PORT=${JELLYSEERR_PORT}"
        echo "SONARR_PORT=${SONARR_PORT}"; echo "RADARR_PORT=${RADARR_PORT}"
        echo "PROWLARR_PORT=${PROWLARR_PORT}"; echo "QBITTORRENT_PORT=${QBITTORRENT_PORT}"
    } > "$env_file" || handle_error 302 "Не удалось записать .env файл."
    
    OPTIONAL_CHOICES=$(whiptail --title "Дополнительные сервисы" --checklist "Выберите сервисы.\n[Пробел] - выбрать/снять, [Enter] - продолжить." 16 78 3 "Homarr" "Дашборд для сервисов" ON "Bazarr" "Автоматические субтитры" ON "Dashdot" "Мониторинг ресурсов" OFF 3>&1 1>&2 2>&3)
    
    if [[ $OPTIONAL_CHOICES == *"Homarr"* ]]; then HOMARR_PORT=$(get_port "Homarr" "7575"); echo "HOMARR_PORT=${HOMARR_PORT}" >> "$env_file"; fi
    if [[ $OPTIONAL_CHOICES == *"Bazarr"* ]]; then BAZARR_PORT=$(get_port "Bazarr" "6767"); echo "BAZARR_PORT=${BAZARR_PORT}" >> "$env_file"; fi
    if [[ $OPTIONAL_CHOICES == *"Dashdot"* ]]; then DASHDOT_PORT=$(get_port "Dashdot" "3001"); echo "DASHDOT_PORT=${DASHDOT_PORT}" >> "$env_file"; fi

    local compose_file="$DOCKER_CONFIG_PATH/docker-compose.yml"
    echo "version: '3.8'" > "$compose_file"; echo "services:" >> "$compose_file"
    generate_service_flaresolverr >> "$compose_file"; generate_service_prowlarr >> "$compose_file"
    generate_service_qbittorrent >> "$compose_file"; generate_service_sonarr >> "$compose_file"
    generate_service_radarr >> "$compose_file"; generate_service_jellyfin >> "$compose_file"
    generate_service_jellyseerr >> "$compose_file"
    if [[ $OPTIONAL_CHOICES == *"Homarr"* ]]; then mkdir -p "$DOCKER_CONFIG_PATH/homarr/configs" "$DOCKER_CONFIG_PATH/homarr/icons"; generate_service_homarr >> "$compose_file"; fi
    if [[ $OPTIONAL_CHOICES == *"Bazarr"* ]]; then generate_service_bazarr >> "$compose_file"; fi
    if [[ $OPTIONAL_CHOICES == *"Dashdot"* ]]; then generate_service_dashdot >> "$compose_file"; fi
    
    print_color "$C_YELLOW" "Шаг 1/2: Скачиваем Docker-образы... Это может занять время. Пожалуйста, подождите."
    (cd "$DOCKER_CONFIG_PATH" && $COMPOSE_CMD pull) || handle_error 403 "Не удалось скачать один или несколько Docker-образов."
    
    print_color "$C_YELLOW" "Шаг 2/2: Запускаем контейнеры..."
    (cd "$DOCKER_CONFIG_PATH" && $COMPOSE_CMD up -d) &>> "$LOG_FILE" || handle_error 401 "Не удалось запустить контейнеры медиа-стека."
    print_color "$C_GREEN" "Медиа-стек успешно запущен!"
    
    MEDIA_STACK_JUST_INSTALLED=true

    local ip_addr; ip_addr=$(hostname -I | awk '{print $1}')
    echo; print_header "--- Адреса установленных сервисов ---"
    
    [ -n "$PORTAINER_URL" ] && printf "%-12s: %s\n" "Portainer" "$PORTAINER_URL"
    printf "%-12s: http://%s:%s\n" "Jellyfin" "$ip_addr" "$JELLYFIN_PORT"
    printf "%-12s: http://%s:%s\n" "Jellyseerr" "$ip_addr" "$JELLYSEERR_PORT"
    printf "%-12s: http://%s:%s\n" "Sonarr" "$ip_addr" "$SONARR_PORT"
    printf "%-12s: http://%s:%s\n" "Radarr" "$ip_addr" "$RADARR_PORT"
    printf "%-12s: http://%s:%s\n" "Prowlarr" "$ip_addr" "$PROWLARR_PORT"
    printf "%-12s: http://%s:%s\n" "qBittorrent" "$ip_addr" "$QBITTORRENT_PORT"
    if [[ $OPTIONAL_CHOICES == *"Homarr"* ]]; then printf "%-12s: http://%s:%s\n" "Homarr" "$ip_addr" "$HOMARR_PORT"; fi
    if [[ $OPTIONAL_CHOICES == *"Bazarr"* ]]; then printf "%-12s: http://%s:%s\n" "Bazarr" "$ip_addr" "$BAZARR_PORT"; fi
    if [[ $OPTIONAL_CHOICES == *"Dashdot"* ]]; then printf "%-12s: http://%s:%s\n" "Dashdot" "$ip_addr" "$DASHDOT_PORT"; fi
    echo
}

main() {
    clear
    print_color "$C_BLUE" "==================================================================="
    print_color "$C_CYAN" " Добро пожаловать в MediaStackInstallarr ${SCRIPT_VERSION} "
    print_color "$C_BLUE" "==================================================================="
    echo -e "\nЭтот скрипт поможет вам быстро развернуть полноценный медиа-сервер."
    echo -e "\n${C_YELLOW}Разработчик:${C_RESET} ${DEV_NAME} (${DEV_TG})"
    echo -e "${C_YELLOW}TikTok:${C_RESET} ${DEV_TT}"
    echo -e "${C_YELLOW}Информационная поддержка:${C_RESET} ${SUPPORT_NAME}"
    echo -e "${C_YELLOW}Огромное спасибо:${C_RESET} ${THANKS_NAME}\n"
    read -p "Нажмите [Enter] для начала установки..."

    set -e
    detect_and_prepare_system
    install_docker
    install_docker_tools
    install_media_stack
    
    if [ "$MEDIA_STACK_JUST_INSTALLED" = true ]; then
        run_post_install_config
    fi
    set +e

    echo; print_color "$C_GREEN" "==================================================================="
    print_color "$C_GREEN" "          🎉 Поздравляем! Установка успешно завершена! 🎉          "
    print_color "$C_GREEN" "==================================================================="
    echo -e "\n${C_YELLOW}Разработчик:${C_RESET} ${DEV_NAME} (${DEV_TG})"
    echo -e "${C_YELLOW}Информационная поддержка:${C_RESET} ${SUPPORT_NAME}"
    echo -e "${C_YELLOW}Огромное спасибо:${C_RESET} ${THANKS_NAME}\n"
    print_color "$C_YELLOW" "Если этот скрипт был полезен, вы можете поддержать разработку:"
    echo -e "💎 ${C_CYAN}Toncoin (TON):${C_RESET}\t$DONATION_TON"
    echo -e "💲 ${C_CYAN}USDT (TRC20):${C_RESET}\t$DONATION_USDT_TRC20"
    echo -e "💲 ${C_CYAN}USDT (TON):${C_RESET}\t\t$DONATION_USDT_TON"
    echo -e "💳 ${C_CYAN}Tinkoff / СБП:${C_RESET}\t$DONATION_TINKOFF"
    echo; print_color "$C_BLUE" "Удачного использования!"; echo
}

main "$@"
exit 0