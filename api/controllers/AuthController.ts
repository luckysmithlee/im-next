import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { LoginCredentials, RegisterData } from '../types/auth.types';
import { ApiResponse } from '../types/api.types';
import { asyncHandler } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const credentials: LoginCredentials = req.body;
    
    if (!credentials.email || !credentials.password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        message: 'Missing required fields'
      });
    }

    const result = await this.authService.login(credentials);
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Login successful'
    };

    res.status(200).json(response);
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const userData: RegisterData = req.body;
    
    if (!userData.name || !userData.email || !userData.password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and password are required',
        message: 'Missing required fields'
      });
    }

    const result = await this.authService.register(userData);
    
    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Registration successful'
    };

    res.status(201).json(response);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
        message: 'Missing refresh token'
      });
    }

    const tokens = await this.authService.refreshToken(refreshToken);
    
    const response: ApiResponse = {
      success: true,
      data: { tokens },
      message: 'Token refreshed successfully'
    };

    res.status(200).json(response);
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    
    await this.authService.logout(userId);
    
    const response: ApiResponse = {
      success: true,
      message: 'Logout successful'
    };

    res.status(200).json(response);
  });

  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    
    const user = await this.authService.getCurrentUser(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }
    
    const response: ApiResponse = {
      success: true,
      data: { user },
      message: 'User retrieved successfully'
    };

    res.status(200).json(response);
  });
}