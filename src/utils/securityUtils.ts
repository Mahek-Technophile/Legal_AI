/**
 * Security utilities for password reset and authentication
 */

export interface SecurityEvent {
  type: 'password_reset_request' | 'password_reset_success' | 'password_reset_failure' | 'suspicious_activity';
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts?: number;
  resetTime?: number;
  remainingTime?: number;
}

/**
 * Rate limiter for password reset attempts
 */
export class PasswordResetRateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number; lastAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly cooldownMs: number;

  constructor(maxAttempts = 3, windowMs = 15 * 60 * 1000, cooldownMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.cooldownMs = cooldownMs;
  }

  /**
   * Check if an email is rate limited
   */
  checkRateLimit(email: string): RateLimitResult {
    const now = Date.now();
    const key = email.toLowerCase();
    const record = this.attempts.get(key);

    if (!record) {
      return { allowed: true, remainingAttempts: this.maxAttempts - 1 };
    }

    // Check if the window has expired
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.delete(key);
      return { allowed: true, remainingAttempts: this.maxAttempts - 1 };
    }

    // Check if in cooldown period
    if (record.count >= this.maxAttempts) {
      const remainingTime = this.cooldownMs - (now - record.lastAttempt);
      if (remainingTime > 0) {
        return {
          allowed: false,
          remainingTime,
          resetTime: record.lastAttempt + this.cooldownMs
        };
      } else {
        // Cooldown expired, reset
        this.attempts.delete(key);
        return { allowed: true, remainingAttempts: this.maxAttempts - 1 };
      }
    }

    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - record.count - 1
    };
  }

  /**
   * Record an attempt
   */
  recordAttempt(email: string): void {
    const now = Date.now();
    const key = email.toLowerCase();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
    } else {
      record.count += 1;
      record.lastAttempt = now;
    }
  }

  /**
   * Clear attempts for an email (e.g., after successful reset)
   */
  clearAttempts(email: string): void {
    this.attempts.delete(email.toLowerCase());
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingTime(email: string): number {
    const record = this.attempts.get(email.toLowerCase());
    if (!record || record.count < this.maxAttempts) {
      return 0;
    }

    const now = Date.now();
    return Math.max(0, this.cooldownMs - (now - record.lastAttempt));
  }
}

/**
 * IP-based rate limiter for additional security
 */
export class IPRateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 10, windowMs = 60 * 60 * 1000) { // 10 attempts per hour
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  checkRateLimit(ipAddress: string): RateLimitResult {
    const now = Date.now();
    const record = this.attempts.get(ipAddress);

    if (!record) {
      return { allowed: true };
    }

    // Check if window has expired
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.delete(ipAddress);
      return { allowed: true };
    }

    if (record.count >= this.maxAttempts) {
      const remainingTime = this.windowMs - (now - record.firstAttempt);
      return {
        allowed: false,
        remainingTime
      };
    }

    return { allowed: true };
  }

  recordAttempt(ipAddress: string): void {
    const now = Date.now();
    const record = this.attempts.get(ipAddress);

    if (!record) {
      this.attempts.set(ipAddress, {
        count: 1,
        firstAttempt: now
      });
    } else {
      record.count += 1;
    }
  }
}

/**
 * Security event logger
 */
export class SecurityLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000;

  /**
   * Log a security event
   */
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.events.push(securityEvent);

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // In a real application, this would send to a logging service
    console.log('Security Event:', securityEvent);
  }

  /**
   * Get recent events for analysis
   */
  getRecentEvents(type?: SecurityEvent['type'], limit = 50): SecurityEvent[] {
    let filtered = this.events;
    
    if (type) {
      filtered = this.events.filter(event => event.type === type);
    }

    return filtered.slice(-limit);
  }

  /**
   * Detect suspicious patterns
   */
  detectSuspiciousActivity(email: string, ipAddress: string): boolean {
    const recentEvents = this.getRecentEvents(undefined, 100);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Check for multiple failed attempts from same IP
    const recentFailures = recentEvents.filter(event => 
      event.type === 'password_reset_failure' &&
      event.ipAddress === ipAddress &&
      (now - new Date(event.timestamp).getTime()) < oneHour
    );

    if (recentFailures.length >= 5) {
      return true;
    }

    // Check for attempts on multiple accounts from same IP
    const uniqueEmails = new Set(
      recentEvents
        .filter(event => 
          event.ipAddress === ipAddress &&
          (now - new Date(event.timestamp).getTime()) < oneHour
        )
        .map(event => event.email)
        .filter(Boolean)
    );

    if (uniqueEmails.size >= 5) {
      return true;
    }

    return false;
  }
}

/**
 * Token validation utilities
 */
export class TokenValidator {
  /**
   * Validate token format and structure
   */
  static validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Basic format validation (adjust based on your token format)
    if (token.length < 32) {
      return false;
    }

    // Check for valid characters (base64url or hex)
    if (!/^[A-Za-z0-9_-]+$/.test(token)) {
      return false;
    }

    return true;
  }

  /**
   * Check if token has expired based on timestamp
   */
  static isTokenExpired(tokenTimestamp: number, expirationMs = 24 * 60 * 60 * 1000): boolean {
    const now = Date.now();
    return (now - tokenTimestamp) > expirationMs;
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

/**
 * HTTPS enforcement utilities
 */
export class SecurityEnforcer {
  /**
   * Check if current connection is secure
   */
  static isSecureConnection(): boolean {
    return window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  /**
   * Enforce HTTPS in production
   */
  static enforceHTTPS(): void {
    if (!this.isSecureConnection() && process.env.NODE_ENV === 'production') {
      window.location.href = window.location.href.replace('http:', 'https:');
    }
  }

  /**
   * Get client IP address (limited in browser environment)
   */
  static async getClientIP(): Promise<string> {
    try {
      // This is a simplified approach - in production, IP would be determined server-side
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get user agent string
   */
  static getUserAgent(): string {
    return navigator.userAgent || 'unknown';
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    return TokenValidator.generateSecureToken(32);
  }

  /**
   * Validate CSRF token
   */
  static validateCSRFToken(token: string, storedToken: string): boolean {
    return token === storedToken && token.length >= 32;
  }
}

// Global instances
export const passwordResetRateLimiter = new PasswordResetRateLimiter();
export const ipRateLimiter = new IPRateLimiter();
export const securityLogger = new SecurityLogger();