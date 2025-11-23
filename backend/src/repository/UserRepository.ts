import { mysqlPool } from '../config/database';
import { User, CreateUserRequest, UpdateUserRequest } from '../model/mysql/User';

export class UserRepository {
  async findAll(): Promise<User[]> {
    try {
      const [rows] = await mysqlPool.execute('SELECT id, username, email, created_at, updated_at FROM users');
      return rows as User[];
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async findById(id: number): Promise<User | null> {
    try {
      const [rows] = await mysqlPool.execute(
        'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error in findById:', error);
      throw new Error('Failed to fetch user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const [rows] = await mysqlPool.execute(
        'SELECT id, username, email, password, created_at, updated_at FROM users WHERE email = ?',
        [email]
      );
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw new Error('Failed to fetch user by email');
    }
  }

  async create(userData: CreateUserRequest): Promise<User> {
    try {
      const [result] = await mysqlPool.execute(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [userData.username, userData.email, userData.password]
      );
      
      const insertResult = result as any;
      const newUser = await this.findById(insertResult.insertId);
      return newUser!;
    } catch (error: any) {
      console.error('Error in create:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('username')) {
          throw new Error('Username already exists');
        } else if (error.message.includes('email')) {
          throw new Error('Email already exists');
        }
      }
      
      throw new Error('Failed to create user');
    }
  }

  async update(id: number, userData: UpdateUserRequest): Promise<User | null> {
    try {
      const fields = [];
      const values = [];

      if (userData.username) {
        fields.push('username = ?');
        values.push(userData.username);
      }
      if (userData.email) {
        fields.push('email = ?');
        values.push(userData.email);
      }
      if (userData.password) {
        fields.push('password = ?');
        values.push(userData.password);
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      values.push(id);

      await mysqlPool.execute(
        `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      return this.findById(id);
    } catch (error: any) {
      console.error('Error in update:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Username or email already exists');
      }
      
      throw new Error('Failed to update user');
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const [result] = await mysqlPool.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      
      const deleteResult = result as any;
      return deleteResult.affectedRows > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw new Error('Failed to delete user');
    }
  }
}