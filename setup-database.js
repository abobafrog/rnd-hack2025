import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

async function createDatabase() {
  try {
    // Подключаемся к MySQL без указания базы данных
    const connection = await mysql.createConnection({
      host: '138.124.14.203',
      port: 3306,
      user: 'root',
      password: 'RNixIsjtRgJ0'
    });

    console.log('✅ Подключение к MySQL серверу установлено');

    // Создаем базу данных
    await connection.execute('CREATE DATABASE IF NOT EXISTS conference_db');
    console.log('✅ База данных conference_db создана');

    // Переключаемся на нашу базу данных
    await connection.execute('USE conference_db');

    // Создаем таблицы
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openId VARCHAR(64) NOT NULL UNIQUE,
        name TEXT,
        email VARCHAR(320),
        loginMethod VARCHAR(64),
        role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        roomCode VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        ownerId INT NOT NULL,
        isActive INT DEFAULT 1 NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roomParticipants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        roomId INT NOT NULL,
        userId INT NOT NULL,
        userName VARCHAR(255) NOT NULL,
        isOnline INT DEFAULT 1 NOT NULL,
        joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chatMessages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        roomId INT NOT NULL,
        userId INT NOT NULL,
        userName VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    console.log('✅ Все таблицы созданы успешно');

    await connection.end();
    console.log('🎉 База данных настроена и готова к использованию!');

  } catch (error) {
    console.error('❌ Ошибка при создании базы данных:', error);
  }
}

createDatabase();


