import { mysqlPool } from "../config/Database";
import { User } from "../model/User";
import { UserLoginEntity } from "../model/UserLoginEntity";
import { UserLogin } from "../model/UserLogin";
import { UserRepository } from "./user.repository";
import { UserEntity } from "../model/UserEntity";
import { generateUID } from "../util/GenerationUID";

let userRepository = new UserRepository();

export class AuthRepository {
  async signUp(userData: UserLogin): Promise<UserEntity> {
    /// Tạo mới 1 user trong bảng user login
    /// Kiểm tra xem trong bảng user tồn tại chưa ( kiểm tra bằng insertId )
    /// Nếu chưa thì tạo mới user trong bảng user -> trả ra data sau đó
    //  Nếu có rồi thì trả ra data của user đó
    try {
      const [result] = await mysqlPool.execute(
        `INSERT INTO userlogin (username, email, password, password_encoded, is_active) VALUES (?,?,?,?,?)`,
        [
          userData.username,
          userData.email,
          userData.password,
          userData.passwordEncoded,
          false,
        ]
      );
      const insertResult = result as any;

      const createUser: User = {
        uid: generateUID(),
        loginId: insertResult.insertId,
        nameInGame: "",
        location: "",
        avatarUrl: "",
        phone: "",
        bio: "",
        status: 0,
      };

      const createdUserEntity = await userRepository.createUser(createUser);
      return createdUserEntity!;
    } catch (error: any) {
      console.error("Error in create:", error);

      if (error.code === "ER_DUP_ENTRY") {
        if (error.message.includes("username")) {
          throw new Error("Username already exists");
        } else if (error.message.includes("email")) {
          throw new Error("Email already exists");
        }
      }

      throw new Error("Failed to create user");
    }
  }

  async login(
    username: string,
    passwordEncoded: string
  ): Promise<UserEntity | null> {
    /// Kiểm tra trong bảng user login
    /// Có thì mới kiểm tra bảng user
    try {
      const [rows] = await mysqlPool.execute(
        `
        SELECT * FROM userlogin 
        WHERE username = ? AND password_encoded = ?
        LIMIT 1
      `,
        [username, passwordEncoded]
      );

      const userLoginEntities = rows as UserLoginEntity[];

      if (!userLoginEntities || userLoginEntities.length === 0) {
        return null;
      }

      const userEntity = userRepository.findById(
        userLoginEntities[0].id
      );

      return userEntity; // user hợp lệ
    } catch (error) {
      console.error("Error in login:", error);
      throw new Error("Failed to login");
    }
  }
}
