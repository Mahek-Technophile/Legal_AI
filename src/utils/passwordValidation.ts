/**
 * Password validation utilities for secure password reset functionality
 */

export interface PasswordStrength {
  score: number; // 0-5
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  color: string;
  text: string;
  feedback: string[];
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: PasswordStrength;
}

/**
 * Validates password strength and requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 8) {
    score += 1;
  }

  if (password.length >= 12) {
    score += 1;
    feedback.push('Good length');
  }

  // Lowercase check
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Uppercase check
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Number check
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Special character check
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Additional strength checks
  if (password.length >= 16) {
    score += 1;
    feedback.push('Excellent length');
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score = Math.max(0, score - 1);
  }

  if (/123|abc|qwe|password|admin/i.test(password)) {
    feedback.push('Avoid common patterns');
    score = Math.max(0, score - 2);
  }

  // Determine strength level
  let level: PasswordStrength['level'];
  let color: string;
  let text: string;

  if (score <= 1) {
    level = 'very-weak';
    color = 'red';
    text = 'Very Weak';
  } else if (score <= 2) {
    level = 'weak';
    color = 'red';
    text = 'Weak';
  } else if (score <= 3) {
    level = 'fair';
    color = 'yellow';
    text = 'Fair';
  } else if (score <= 4) {
    level = 'good';
    color = 'blue';
    text = 'Good';
  } else {
    level = 'strong';
    color = 'green';
    text = 'Strong';
  }

  const strength: PasswordStrength = {
    score,
    level,
    color,
    text,
    feedback
  };

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Checks if password meets minimum security requirements
 */
export function meetsMinimumRequirements(password: string): boolean {
  return (
    password.length >= 8 &&
    /(?=.*[a-z])/.test(password) &&
    /(?=.*[A-Z])/.test(password) &&
    /(?=.*\d)/.test(password) &&
    /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?])/.test(password)
  );
}

/**
 * Generates password strength indicator width percentage
 */
export function getStrengthWidth(score: number): number {
  return Math.min(100, (score / 5) * 100);
}

/**
 * Common password patterns to avoid
 */
export const COMMON_PATTERNS = [
  'password',
  '123456',
  'qwerty',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'master',
  'shadow'
];

/**
 * Checks for common password patterns
 */
export function containsCommonPattern(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  return COMMON_PATTERNS.some(pattern => lowerPassword.includes(pattern));
}

/**
 * Estimates password crack time (simplified)
 */
export function estimateCrackTime(password: string): string {
  const charset = getCharsetSize(password);
  const entropy = Math.log2(Math.pow(charset, password.length));
  
  if (entropy < 30) return 'Instantly';
  if (entropy < 40) return 'Minutes';
  if (entropy < 50) return 'Hours';
  if (entropy < 60) return 'Days';
  if (entropy < 70) return 'Months';
  if (entropy < 80) return 'Years';
  return 'Centuries';
}

function getCharsetSize(password: string): number {
  let size = 0;
  
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) size += 32;
  
  return size;
}