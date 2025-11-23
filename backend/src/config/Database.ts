import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

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
    // Tạo bảng users
    const createUserTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await mysqlPool.execute(createUserTableSQL);
    console.log('✅ Users table is ready');

    // Tạo bảng games
    const createGamesTableSQL = `
      CREATE TABLE IF NOT EXISTS games (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        max_players INT DEFAULT 4,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await mysqlPool.execute(createGamesTableSQL);
    console.log('✅ Games table is ready');

    // Tạo bảng game_sessions
    const createGameSessionsTableSQL = `
      CREATE TABLE IF NOT EXISTS game_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_code VARCHAR(10) UNIQUE NOT NULL,
        game_id INT,
        host_user_id INT,
        status ENUM('waiting', 'active', 'finished') DEFAULT 'waiting',
        max_players INT DEFAULT 4,
        current_players INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id) REFERENCES games(id),
        FOREIGN KEY (host_user_id) REFERENCES users(id)
      )
    `;

    await mysqlPool.execute(createGameSessionsTableSQL);
    console.log('✅ Game sessions table is ready');

    // Thêm dữ liệu mẫu vào bảng games
    await seedSampleData();

  } catch (error) {
    console.error('❌ Table creation failed:', error);
    throw error;
  }
};

// Hàm thêm dữ liệu mẫu
const seedSampleData = async (): Promise<void> => {
  try {
    // Kiểm tra xem đã có dữ liệu trong bảng games chưa
    const [rows] = await mysqlPool.execute('SELECT COUNT(*) as count FROM games');
    const count = (rows as any)[0].count;

    if (count === 0) {
      // Thêm các game mẫu
      const sampleGames = [
        ['Cờ vua', 'Trò chơi chiến thuật cổ điển', 2],
        ['Cờ tướng', 'Trò chơi trí tuệ phương Đông', 2],
        ['Bài Poker', 'Trò chơi bài đầy kịch tính', 6],
        ['Monopoly', 'Trò chơi bất động sản', 4],
        ['Uno', 'Trò chơi bài gia đình', 4]
      ];

      for (const game of sampleGames) {
        await mysqlPool.execute(
          'INSERT INTO games (name, description, max_players) VALUES (?, ?, ?)',
          game
        );
      }
      console.log('✅ Sample games data added');
    }
  } catch (error) {
    console.error('❌ Seeding sample data failed:', error);
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