export const SQL_TEMPLATES = {
  // 1. Bảng userlogin (authentication)
  USER_LOGIN_TABLE: `
    CREATE TABLE IF NOT EXISTS userlogin (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      password_encoded VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP NULL, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_username (username),
      INDEX idx_email (email),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 2. Bảng user chính (profile)
  USER_TABLE: `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uid VARCHAR(50) UNIQUE NOT NULL,
      name_in_game VARCHAR(50) NOT NULL,
      status TINYINT DEFAULT 0 COMMENT '0: offline, 1: online, 2: in-game, 3: busy',
      location VARCHAR(255) NULL,
      avatar_url VARCHAR(500) NULL,
      phone VARCHAR(20) NULL,
      bio TEXT NULL,
      total_games_played INT DEFAULT 0,
      total_games_won INT DEFAULT 0,
      gold INT DEFAULT 1000,
      experience_points INT DEFAULT 0,
      level INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_seen_at TIMESTAMP NULL,
      
      -- Foreign key với cascade
      login_id INT NOT NULL,
      CONSTRAINT fk_users_login 
        FOREIGN KEY (login_id) 
        REFERENCES userlogin(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      
      -- Indexes
      INDEX idx_uid (uid),
      INDEX idx_status (status),
      INDEX idx_login_id (login_id),
      INDEX idx_level (level),
      INDEX idx_created_at (created_at),
      FULLTEXT INDEX idx_search (name_in_game, bio)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 3. Bảng rooms
  ROOMS_TABLE: `
    CREATE TABLE IF NOT EXISTS rooms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      room_id VARCHAR(50) UNIQUE NOT NULL COMMENT 'Public room identifier',
      room_name VARCHAR(100) NULL,
      description TEXT NULL,
      player_ids JSON DEFAULT ('[]'),
      host_id VARCHAR(50) NOT NULL,
      max_players INT DEFAULT 4,
      current_players INT GENERATED ALWAYS AS (JSON_LENGTH(player_ids)) VIRTUAL,
      is_using BOOLEAN DEFAULT TRUE,
      is_private BOOLEAN DEFAULT FALSE,
      password VARCHAR(100) NULL,
      game_mode VARCHAR(50) DEFAULT 'default',
      game_settings JSON DEFAULT ('{}'),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL,
      
      -- Indexes
      INDEX idx_room_id (room_id),
      INDEX idx_host_id (host_id),
      INDEX idx_is_using (is_using),
      INDEX idx_game_mode (game_mode),
      INDEX idx_is_private (is_private),
      INDEX idx_created_at (created_at),
      INDEX idx_last_activity (last_activity_at),
      INDEX idx_player_count (current_players),
      INDEX idx_expires_at (expires_at),
      
      -- Full-text search for room name and description
      FULLTEXT INDEX idx_room_search (room_name, description)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 4. Bảng games
  GAMES_TABLE: `
    CREATE TABLE IF NOT EXISTS games (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      game_id VARCHAR(50) UNIQUE NOT NULL,
      room_id VARCHAR(50) NOT NULL,
      active_deck JSON DEFAULT ('[]'),
      used_deck JSON DEFAULT ('[]'),
      turn_cycle_clock BOOLEAN DEFAULT TRUE,
      current_player_id VARCHAR(50) DEFAULT NULL,
      current_turn_started_at TIMESTAMP NULL,
      turn_time_limit INT DEFAULT 60 COMMENT 'seconds',
      active_player_ids JSON DEFAULT ('[]'),
      inactive_player_ids JSON DEFAULT ('[]'),
      observer_player_ids JSON DEFAULT ('[]'),
      max_players INT DEFAULT 4,
      game_mode VARCHAR(50) NOT NULL,
      game_settings JSON DEFAULT ('{}'),
      status ENUM('WAITING', 'ACTIVE', 'FINISHED', 'CANCELLED') DEFAULT 'WAITING',
      winner_id VARCHAR(50) DEFAULT NULL,
      winner_reason VARCHAR(255) DEFAULT NULL,
      total_turns INT DEFAULT 0,
      total_cards_drawn INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      started_at TIMESTAMP NULL,
      finished_at TIMESTAMP NULL,
      
      -- Foreign keys với cascade
      CONSTRAINT fk_games_rooms 
        FOREIGN KEY (room_id) 
        REFERENCES rooms(room_id) 
        ON DELETE CASCADE,
      
      -- Check constraints (MySQL 8.0.16+)
      CONSTRAINT chk_game_status CHECK (
        (status = 'waiting' AND started_at IS NULL AND finished_at IS NULL) OR
        (status = 'active' AND started_at IS NOT NULL AND finished_at IS NULL) OR
        (status IN ('finished', 'cancelled') AND started_at IS NOT NULL)
      ),
      
      -- Indexes
      INDEX idx_games_game_id (game_id),
      INDEX idx_games_room_id (room_id),
      INDEX idx_games_status (status),
      INDEX idx_games_current_player (current_player_id),
      INDEX idx_games_game_mode (game_mode),
      INDEX idx_games_created_at (created_at),
      INDEX idx_games_started_at (started_at),
      INDEX idx_games_finished_at (finished_at),
      INDEX idx_games_winner (winner_id),
      INDEX idx_games_active_players ((CAST(active_player_ids AS CHAR(255) ARRAY)))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 5. Bảng game_history (lưu lịch sử game)
  GAME_HISTORY_TABLE: `
    CREATE TABLE IF NOT EXISTS game_history (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      game_id VARCHAR(50) NOT NULL,
      player_id VARCHAR(50) NOT NULL,
      action_type VARCHAR(50) NOT NULL COMMENT 'join, leave, draw_card, play_card, win, lose',
      action_data JSON DEFAULT ('{}'),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      -- Indexes
      INDEX idx_history_game_id (game_id),
      INDEX idx_history_player_id (player_id),
      INDEX idx_history_action_type (action_type),
      INDEX idx_history_created_at (created_at),
      
      -- Foreign key
      CONSTRAINT fk_history_games 
        FOREIGN KEY (game_id) 
        REFERENCES games(game_id) 
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 6. Bảng user_statistics
  USER_STATISTICS_TABLE: `
    CREATE TABLE IF NOT EXISTS user_statistics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      game_mode VARCHAR(50) NOT NULL,
      total_games_played INT DEFAULT 0,
      total_games_won INT DEFAULT 0,
      total_games_lost INT DEFAULT 0,
      win_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
          WHEN total_games_played = 0 THEN 0
          ELSE (total_games_won * 100.0 / total_games_played)
        END
      ) VIRTUAL,
      total_cards_drawn INT DEFAULT 0,
      total_cards_played INT DEFAULT 0,
      average_game_duration INT DEFAULT 0,
      last_played_at TIMESTAMP NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      UNIQUE KEY uk_user_game_mode (user_id, game_mode),
      INDEX idx_user_id (user_id),
      INDEX idx_game_mode (game_mode),
      INDEX idx_win_rate (win_rate),
      
      CONSTRAINT fk_stats_users 
        FOREIGN KEY (user_id) 
        REFERENCES users(uid) 
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};