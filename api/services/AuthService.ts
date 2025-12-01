import { User, LoginCredentials, RegisterData, AuthTokens } from '../types/auth.types';
import { UserRepository } from '../repositories/UserRepository';
import { JWTUtil } from '../utils/jwt';
import { PasswordUtil } from '../utils/password';
import { AppError } from '../middlewares/errorHandler';

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password } = credentials;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update online status
    await this.userRepository.updateOnlineStatus(user.id, true);

    // Generate tokens
    const tokens = JWTUtil.generateTokens({
      userId: user.id,
      email: user.email
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword as User,
      tokens
    };
  }

  async register(userData: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const { name, email, password, avatar } = userData;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Validate password
    const passwordValidation = PasswordUtil.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new AppError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hashPassword(password);

    // Create user
    const newUser = await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      avatar: avatar || this.generateDefaultAvatar(name),
      online: true,
      lastSeen: new Date()
    });

    // Generate tokens
    const tokens = JWTUtil.generateTokens({
      userId: newUser.id,
      email: newUser.email
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return {
      user: userWithoutPassword as User,
      tokens
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const newAccessToken = JWTUtil.generateAccessTokenFromRefreshToken(refreshToken);
      
      // Generate new refresh token as well for security
      const payload = JWTUtil.verifyToken(refreshToken);
      const newTokens = JWTUtil.generateTokens({
        userId: payload.userId,
        email: payload.email
      });

      return newTokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async logout(userId: string): Promise<void> {
    // Update user's online status
    await this.userRepository.updateOnlineStatus(userId, false);
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  private generateDefaultAvatar(name: string): string {
    // Generate a simple avatar based on name
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const color = colors[name.length % colors.length];
    const initials = name.charAt(0).toUpperCase();
    
    return `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${color}"/>
        <text x="50" y="55" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">
          ${initials}
        </text>
      </svg>
    `).toString('base64')}`;
  }
}