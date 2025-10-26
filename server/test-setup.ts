import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createConnection } from "mysql2/promise";
import { ENV } from "./_core/env";

// Тестовая база данных
const TEST_DB_NAME = "utki_test";

export async function setupTestDatabase() {
  // Создаем подключение к MySQL без указания базы данных
  const connection = await createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  // Создаем тестовую базу данных если её нет
  await connection.execute(`CREATE DATABASE IF NOT EXISTS ${TEST_DB_NAME}`);
  await connection.end();

  // Создаем подключение к тестовой базе данных
  const testDbUrl = `mysql://${process.env.DB_USER || "root"}:${process.env.DB_PASSWORD || ""}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "3306"}/${TEST_DB_NAME}`;

  const db = drizzle(testDbUrl);

  // Применяем миграции
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });

  return db;
}

export async function cleanupTestDatabase() {
  const connection = await createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  await connection.execute(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
  await connection.end();
}
