// Простой HTTP сервер для тестирования внешнего доступа
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 8080;

// Проксируем запросы на локальный сервер
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true, // поддержка WebSocket
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Сервер доступен по адресу:`);
  console.log(`   Локально: http://localhost:${PORT}`);
  console.log(`   Внешне: http://138.124.14.203:${PORT}`);
  console.log(`   (если порт ${PORT} открыт в файрволе)`);
});


