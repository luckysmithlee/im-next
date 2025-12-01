export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function isValidMessage(content: string): boolean {
  return content.trim().length > 0 && content.trim().length <= 1000;
}

export function isValidUserId(userId: string): boolean {
  return userId && userId.trim().length > 0;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}