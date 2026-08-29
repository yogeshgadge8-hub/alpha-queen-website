import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function database() {
  if (!pool) {
    pool = mysql.createPool({
      host: required("MYSQL_HOST"),
      port: Number(process.env.MYSQL_PORT || 3306),
      user: required("MYSQL_USER"),
      password: required("MYSQL_PASSWORD"),
      database: required("MYSQL_DATABASE"),
      waitForConnections: true,
      connectionLimit: 8,
      queueLimit: 0,
      charset: "utf8mb4",
    });
  }
  return pool;
}

export async function ensureSchema() {
  if (!schemaReady) schemaReady = initializeSchema();
  return schemaReady;
}

async function initializeSchema() {
  const db = database();
  await db.query(`CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(40) PRIMARY KEY,
    source ENUM('website','instagram','whatsapp') NOT NULL,
    status ENUM('new','confirmed','packed','shipped','delivered','cancelled') NOT NULL DEFAULT 'new',
    customer_name VARCHAR(160) NOT NULL,
    mobile VARCHAR(10) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255) NOT NULL DEFAULT '',
    landmark VARCHAR(255) NOT NULL DEFAULT '',
    pincode VARCHAR(6) NOT NULL,
    city VARCHAR(120) NOT NULL,
    state VARCHAR(120) NOT NULL,
    items_json LONGTEXT NOT NULL,
    subtotal INT UNSIGNED NOT NULL,
    shipping INT UNSIGNED NOT NULL DEFAULT 0,
    total INT UNSIGNED NOT NULL,
    payment_status ENUM('pending','paid') NOT NULL DEFAULT 'pending',
    note TEXT NOT NULL,
    created_at DATETIME(3) NOT NULL,
    INDEX idx_orders_created_at (created_at),
    INDEX idx_orders_mobile (mobile)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  await db.query(`CREATE TABLE IF NOT EXISTS admins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NOT NULL
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  await db.query(`CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash CHAR(64) PRIMARY KEY,
    admin_id BIGINT UNSIGNED NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    INDEX idx_admin_sessions_admin (admin_id),
    INDEX idx_admin_sessions_expiry (expires_at),
    CONSTRAINT fk_admin_sessions_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  await db.query(`CREATE TABLE IF NOT EXISTS inventory (
    product_id INT UNSIGNED PRIMARY KEY,
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 5,
    updated_at DATETIME(3) NOT NULL
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  await db.query(`CREATE TABLE IF NOT EXISTS product_media (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NOT NULL,
    media_type ENUM('image','video') NOT NULL,
    media_url VARCHAR(1200) NOT NULL,
    alt_text VARCHAR(255) NOT NULL DEFAULT '',
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL,
    INDEX idx_product_media_product (product_id, sort_order)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  await db.query(`CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    title VARCHAR(160) NOT NULL DEFAULT '',
    review_text TEXT NOT NULL,
    media_url VARCHAR(1200) NOT NULL DEFAULT '',
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    created_at DATETIME(3) NOT NULL,
    INDEX idx_reviews_product_status (product_id, status, created_at)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  const now = new Date();
  for (let productId = 1; productId <= 8; productId += 1) {
    await db.execute("INSERT IGNORE INTO inventory (product_id, stock, low_stock_threshold, updated_at) VALUES (?, 0, 5, ?)", [productId, now]);
  }
}
