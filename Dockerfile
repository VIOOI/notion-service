# Dockerfile
FROM denoland/deno:alpine-1.46.3

# Создаем рабочую директорию
WORKDIR /app

# Копируем файлы конфигурации
COPY deno.json deno.lock* ./

# Копируем исходный код
COPY . .

# Кешируем зависимости
RUN deno cache main.ts

# Экспонируем порт
EXPOSE 3000

# Запускаем приложение
CMD ["deno", "run", "--allow-all", "main.ts"]
