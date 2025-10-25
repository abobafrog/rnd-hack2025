#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const args = process.argv.slice(2);
const testType = args[0] || 'all';

console.log(`🧪 Запуск тестов: ${testType}`);

// Проверяем наличие .env файла
if (!existsSync('.env')) {
  console.log('⚠️  Файл .env не найден. Создайте его с настройками базы данных.');
  console.log('Пример:');
  console.log('DB_HOST=localhost');
  console.log('DB_PORT=3306');
  console.log('DB_USER=root');
  console.log('DB_PASSWORD=your_password');
  process.exit(1);
}

try {
  switch (testType) {
    case 'unit':
      console.log('📊 Запуск unit тестов...');
      execSync('pnpm test:unit', { stdio: 'inherit' });
      break;
    
    case 'api':
      console.log('🔌 Запуск API тестов...');
      execSync('pnpm test:api', { stdio: 'inherit' });
      break;
    
    case 'components':
      console.log('⚛️  Запуск компонентных тестов...');
      execSync('pnpm test:components', { stdio: 'inherit' });
      break;
    
    case 'e2e':
      console.log('🎯 Запуск E2E тестов...');
      execSync('pnpm test:e2e', { stdio: 'inherit' });
      break;
    
    case 'coverage':
      console.log('📈 Запуск тестов с покрытием...');
      execSync('pnpm test:coverage', { stdio: 'inherit' });
      break;
    
    case 'all':
    default:
      console.log('🚀 Запуск всех тестов...');
      execSync('pnpm test', { stdio: 'inherit' });
      break;
  }
  
  console.log('✅ Тесты завершены успешно!');
} catch (error) {
  console.error('❌ Тесты завершились с ошибками:', error.message);
  process.exit(1);
}





