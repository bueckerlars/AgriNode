import { Request, Response } from 'express';

// Mock user data for testing
export const testUser = {
  user_id: 'test-user-id',
  id: 'test-user-id', // Some controllers use id, others use user_id
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  created_at: new Date(),
  updated_at: new Date()
};

export const testAdmin = {
  user_id: 'test-admin-id',
  id: 'test-admin-id',
  username: 'testadmin',
  email: 'admin@example.com',
  role: 'admin',
  created_at: new Date(),
  updated_at: new Date()
};

// Helper to create a mock Express request
export const createMockRequest = (options: {
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  cookies?: any;
  user?: any;
}): Partial<Request> => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    cookies: options.cookies || {},
    user: options.user,
    get: jest.fn((header) => {
      return options.headers?.[header];
    })
  };
};

// Helper to create a mock Express response
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis()
  };
  return res;
};