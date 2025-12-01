import { User } from '../types/auth.types';

// In-memory storage for demo purposes
// In a real application, this would be a database
const users: User[] = [
  {
    id: '1',
    name: '张三',
    email: 'test@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..G', // password
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20avatar%20of%20a%20Chinese%20person%20named%20Zhang%20San%2C%20clean%20background%2C%20professional%20lighting&image_size=square',
    online: true,
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..G', // password
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20avatar%20of%20a%20Chinese%20person%20named%20Li%20Si%2C%20warm%20smile%2C%20professional%20lighting&image_size=square',
    online: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PJ/..G', // password
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20avatar%20of%20a%20Chinese%20person%20named%20Wang%20Wu%2C%20confident%20expression%2C%20professional%20lighting&image_size=square',
    online: true,
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return users.find(user => user.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return users.find(user => user.email === email) || null;
  }

  async findAll(): Promise<User[]> {
    return [...users];
  }

  async findAllExcept(userId: string): Promise<User[]> {
    return users.filter(user => user.id !== userId);
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.push(newUser);
    return newUser;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...updates,
      updatedAt: new Date()
    };

    return users[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return false;

    users.splice(index, 1);
    return true;
  }

  async updateOnlineStatus(id: string, online: boolean): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;

    return this.update(id, {
      online,
      lastSeen: online ? new Date() : user.lastSeen
    });
  }
}