import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import { encodePassword } from '../util/EncodeDecode';
import { generateUID } from '../util/GenerationUID';
import { SQL_TEMPLATES } from './DatabaseCommand';
import { SAMPLE_DATA } from './DatabaseSampleData';

dotenv.config();

// MySQL Configuration
export const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'myboardgame',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Tạo connection pool không specify database trước
let mysqlPool: Pool;

// Hàm kiểm tra và tạo database nếu chưa tồn tại
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔧 Initializing database...');

    // Bước 1: Kết nối MySQL mà không chọn database
    const tempPool = createPool({
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      password: mysqlConfig.password
    });

    // Bước 2: Tạo database nếu chưa tồn tại
    const createDBSQL = `CREATE DATABASE IF NOT EXISTS \`${mysqlConfig.database}\``;
    await tempPool.execute(createDBSQL);
    console.log(`✅ Database '${mysqlConfig.database}' is ready`);

    // Bước 3: Đóng kết nối tạm
    await tempPool.end();

    // Bước 4: Tạo connection pool với database đã được tạo
    mysqlPool = createPool(mysqlConfig);

    // Bước 5: Kiểm tra kết nối
    const connection: PoolConnection = await mysqlPool.getConnection();
    console.log('✅ Connected to MySQL database successfully!');
    connection.release();

    // Bước 6: Tạo các bảng
    await createTables();

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};


// Hàm tạo các bảng
const createTables = async (): Promise<void> => {
  try {

    // 1. Tạo bảng userlogin
    console.log('📋 Creating userlogin table...');
    await mysqlPool.execute(SQL_TEMPLATES.USER_LOGIN_TABLE);

    // 2. Tạo user mặc định
    console.log('👤 Creating default user...');
    const insertUserLoginSQL = `
      INSERT IGNORE INTO userlogin 
      (username, email, password, password_encoded) 
      VALUES (?, ?, ?, ?)
    `;

    await mysqlPool.execute(insertUserLoginSQL, [
      SAMPLE_DATA.DEFAULT_USER.username,
      SAMPLE_DATA.DEFAULT_USER.email,
      SAMPLE_DATA.DEFAULT_USER.password,
      SAMPLE_DATA.DEFAULT_USER.passwordEncoded
    ]);

    // 3. Tạo bảng users
    console.log('📋 Creating users table...');
    await mysqlPool.execute(SQL_TEMPLATES.USER_TABLE);
    // Tạo bảng user ( dùng để sử dụng chính trong app )

    await mysqlPool.execute(
      SQL_TEMPLATES.USER_TABLE,
    )

    console.log('👤 Creating default user profile...');
    const insertUserSQL = `
      INSERT IGNORE INTO users 
      (name_in_game, uid, status, location, avatar_url, phone, bio, login_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 
        (SELECT id FROM userlogin WHERE username = ? LIMIT 1)
      )
    `;

    await mysqlPool.execute(insertUserSQL, [
      SAMPLE_DATA.DEFAULT_MAIN_USER.name_in_game,
      generateUID(),
      SAMPLE_DATA.DEFAULT_MAIN_USER.status,
      SAMPLE_DATA.DEFAULT_MAIN_USER.location,
      SAMPLE_DATA.DEFAULT_MAIN_USER.avatar_url,
      SAMPLE_DATA.DEFAULT_MAIN_USER.phone,
      SAMPLE_DATA.DEFAULT_MAIN_USER.bio,
      SAMPLE_DATA.DEFAULT_USER.username
    ]);

    await mysqlPool.execute(SQL_TEMPLATES.ROOMS_TABLE);
    console.log('✅ Rooms table is ready');

    // Tạo bảng game_sessions


    await mysqlPool.execute(SQL_TEMPLATES.GAMES_TABLE);
    console.log('✅ Games tables is ready');


  } catch (error) {
    console.error('❌ Table creation failed:', error);
    throw error;
  }
};

// Hàm kiểm tra kết nối (sau khi đã khởi tạo)
export const testConnection = async (): Promise<boolean> => {
  try {
    if (!mysqlPool) {
      await initializeDatabase();
    }

    const connection: PoolConnection = await mysqlPool.getConnection();
    console.log('✅ MySQL connection test passed!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection test failed:', error);
    return false;
  }
};

// Export pool để sử dụng trong repositories
export { mysqlPool };