/**
 * Security Utilities for Samsung Security Shield
 * Provides cryptographically secure functions and input validation
 */

export class SecurityUtils {
  // Cryptographically secure random number generation
  public static secureRandom(): number {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / (0xFFFFFFFF + 1);
    }
    // Fallback for environments without crypto API
    return Math.random();
  }

  // Generate secure random in range
  public static secureRandomInRange(min: number, max: number): number {
    return min + (this.secureRandom() * (max - min));
  }

  // Input validation for coordinates
  public static validateCoordinates(x: number, y: number): boolean {
    return (
      typeof x === 'number' && 
      typeof y === 'number' &&
      !isNaN(x) && !isNaN(y) &&
      isFinite(x) && isFinite(y) &&
      x >= 0 && y >= 0 &&
      x <= 10000 && y <= 10000 // Reasonable screen size limits
    );
  }

  // Input validation for pressure
  public static validatePressure(pressure: number): boolean {
    return (
      typeof pressure === 'number' &&
      !isNaN(pressure) &&
      isFinite(pressure) &&
      pressure >= 0 &&
      pressure <= 1
    );
  }

  // Input validation for timestamp
  public static validateTimestamp(timestamp: number): boolean {
    const now = Date.now();
    return (
      typeof timestamp === 'number' &&
      !isNaN(timestamp) &&
      isFinite(timestamp) &&
      timestamp > 0 &&
      timestamp <= now + 1000 && // Allow 1 second future tolerance
      timestamp >= now - 3600000 // Allow 1 hour past tolerance
    );
  }

  // Sanitize string input
  public static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[\\]/g, '') // Remove backslashes
      .substring(0, 1000); // Limit length
  }

  // Safe division with zero check
  public static safeDivision(numerator: number, denominator: number, defaultValue: number = 0): number {
    if (denominator === 0 || !isFinite(denominator) || isNaN(denominator)) {
      return defaultValue;
    }
    
    const result = numerator / denominator;
    return isFinite(result) ? result : defaultValue;
  }

  // Bounded array operations
  public static boundedArrayPush<T>(array: T[], item: T, maxSize: number): void {
    if (array.length >= maxSize) {
      // Remove multiple items if over limit to prevent gradual overflow
      const removeCount = Math.max(1, Math.floor(maxSize * 0.1));
      array.splice(0, removeCount);
    }
    array.push(item);
  }

  // Safe number operations with bounds checking
  public static boundedNumber(value: number, min: number, max: number): number {
    if (isNaN(value)) {
      return min;
    }
    if (!isFinite(value)) {
      return value === Infinity ? max : min;
    }
    return Math.max(min, Math.min(max, value));
  }

  // Timing-safe comparison to prevent timing attacks
  public static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  // Rate limiting helper
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  public static checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  // Memory usage monitoring
  public static getMemoryUsage(): { used: number; total: number } {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      };
    }
    return { used: 0, total: 0 };
  }

  // Secure logging (removes sensitive data)
  public static secureLog(message: string, data?: any): void {
    if (__DEV__) {
      const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
      console.log(`[SECURE] ${message}`, sanitizedData);
    }
  }

  private static sanitizeLogData(data: any): any {
    if (typeof data === 'string') {
      return data.substring(0, 100) + (data.length > 100 ? '...' : '');
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const key in data) {
        if (key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('key')) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof data[key] === 'string' && data[key].length > 100) {
          sanitized[key] = data[key].substring(0, 100) + '...';
        } else {
          sanitized[key] = data[key];
        }
      }
      return sanitized;
    }
    
    return data;
  }
}
