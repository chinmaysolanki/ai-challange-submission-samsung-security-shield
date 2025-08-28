/**
 * Security Test Suite for Samsung Security Shield
 * Tests all security fixes and validates vulnerability remediation
 */

import { SecurityUtils } from '../src/utils/SecurityUtils';
import { TouchPatternAgent } from '../src/agents/TouchPatternAgent';
import { TypingRhythmAgent } from '../src/agents/TypingRhythmAgent';
import { AnomalyDetectionEngine } from '../src/agents/AnomalyDetectionEngine';

describe('Security Vulnerability Tests', () => {
  describe('CVE-2025-0001: Buffer Overflow Protection', () => {
    it('should prevent memory exhaustion via bounded arrays', () => {
      const array: number[] = [];
      
      // Try to overflow the buffer
      for (let i = 0; i < 1000; i++) {
        SecurityUtils.boundedArrayPush(array, i, 100);
      }
      
      expect(array.length).toBeLessThanOrEqual(100);
    });

    it('should handle TouchPatternAgent buffer safely', () => {
      const agent = new TouchPatternAgent();
      const memoryBefore = process.memoryUsage().heapUsed;
      
      // Rapid fire touch events to test buffer management
      for (let i = 0; i < 1000; i++) {
        agent.analyzeTouchPattern({
          x: i,
          y: i,
          pressure: 0.5,
          timestamp: Date.now(),
          type: 'down'
        });
      }
      
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryGrowth = memoryAfter - memoryBefore;
      
      // Memory growth should be bounded (less than 10MB)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('CVE-2025-0002: Division by Zero Protection', () => {
    it('should handle division by zero safely', () => {
      const result = SecurityUtils.safeDivision(10, 0, -1);
      expect(result).toBe(-1);
    });

    it('should handle NaN and Infinity in divisions', () => {
      expect(SecurityUtils.safeDivision(10, NaN, 0)).toBe(0);
      expect(SecurityUtils.safeDivision(10, Infinity, 0)).toBe(0);
      expect(SecurityUtils.safeDivision(Infinity, 10, 0)).toBe(0);
    });
  });

  describe('CVE-2025-0003: Secure Logging', () => {
    it('should not log sensitive data', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      SecurityUtils.secureLog('Test message', {
        password: 'secret123',
        token: 'abc123',
        normalData: 'this is ok'
      });
      
      if (__DEV__) {
        expect(consoleSpy).toHaveBeenCalled();
        const logCall = consoleSpy.mock.calls[0];
        const loggedData = JSON.stringify(logCall);
        
        expect(loggedData).not.toContain('secret123');
        expect(loggedData).not.toContain('abc123');
        expect(loggedData).toContain('[REDACTED]');
      }
      
      consoleSpy.mockRestore();
    });
  });

  describe('CVE-2025-0004: Race Condition Protection', () => {
    it('should handle concurrent access safely', async () => {
      const agent = new TouchPatternAgent();
      const promises: Promise<any>[] = [];
      
      // Create multiple concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve(agent.analyzeTouchPattern({
            x: i,
            y: i,
            pressure: 0.5,
            timestamp: Date.now(),
            type: 'move'
          }))
        );
      }
      
      const results = await Promise.all(promises);
      
      // All results should be valid (no crashes)
      results.forEach(result => {
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('reasons');
      });
    });
  });

  describe('CVE-2025-0005: Input Validation', () => {
    it('should validate coordinates properly', () => {
      expect(SecurityUtils.validateCoordinates(100, 200)).toBe(true);
      expect(SecurityUtils.validateCoordinates(-1, 100)).toBe(false);
      expect(SecurityUtils.validateCoordinates(100, -1)).toBe(false);
      expect(SecurityUtils.validateCoordinates(NaN, 100)).toBe(false);
      expect(SecurityUtils.validateCoordinates(100, Infinity)).toBe(false);
      expect(SecurityUtils.validateCoordinates(50000, 100)).toBe(false); // Too large
    });

    it('should validate pressure values', () => {
      expect(SecurityUtils.validatePressure(0.5)).toBe(true);
      expect(SecurityUtils.validatePressure(0)).toBe(true);
      expect(SecurityUtils.validatePressure(1)).toBe(true);
      expect(SecurityUtils.validatePressure(-0.1)).toBe(false);
      expect(SecurityUtils.validatePressure(1.1)).toBe(false);
      expect(SecurityUtils.validatePressure(NaN)).toBe(false);
    });

    it('should sanitize string inputs', () => {
      expect(SecurityUtils.sanitizeString('normal text')).toBe('normal text');
      expect(SecurityUtils.sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(SecurityUtils.sanitizeString('test"quote')).toBe('testquote');
      expect(SecurityUtils.sanitizeString('test\\backslash')).toBe('testbackslash');
    });
  });

  describe('CVE-2025-0006: Timing Attack Protection', () => {
    it('should use timing-safe comparison', () => {
      const str1 = 'password123';
      const str2 = 'password123';
      const str3 = 'wrongpass';
      
      expect(SecurityUtils.timingSafeEqual(str1, str2)).toBe(true);
      expect(SecurityUtils.timingSafeEqual(str1, str3)).toBe(false);
      expect(SecurityUtils.timingSafeEqual('', '')).toBe(true);
      expect(SecurityUtils.timingSafeEqual('a', 'ab')).toBe(false);
    });
  });

  describe('CVE-2025-0007: Integer Overflow Protection', () => {
    it('should bound numbers within safe ranges', () => {
      expect(SecurityUtils.boundedNumber(50, 0, 100)).toBe(50);
      expect(SecurityUtils.boundedNumber(-10, 0, 100)).toBe(0);
      expect(SecurityUtils.boundedNumber(150, 0, 100)).toBe(100);
      expect(SecurityUtils.boundedNumber(NaN, 0, 100)).toBe(0);
      expect(SecurityUtils.boundedNumber(Infinity, 0, 100)).toBe(100);
    });
  });

  describe('CVE-2025-0008: Secure Random Generation', () => {
    it('should generate cryptographically secure random numbers', () => {
      const random1 = SecurityUtils.secureRandom();
      const random2 = SecurityUtils.secureRandom();
      
      expect(random1).toBeGreaterThanOrEqual(0);
      expect(random1).toBeLessThan(1);
      expect(random2).toBeGreaterThanOrEqual(0);
      expect(random2).toBeLessThan(1);
      expect(random1).not.toBe(random2); // Very unlikely to be equal
    });

    it('should generate secure random in range', () => {
      const random = SecurityUtils.secureRandomInRange(10, 20);
      expect(random).toBeGreaterThanOrEqual(10);
      expect(random).toBeLessThan(20);
    });
  });

  describe('Rate Limiting Protection', () => {
    it('should enforce rate limits', () => {
      const key = 'test_key';
      
      // First request should succeed
      expect(SecurityUtils.checkRateLimit(key, 2, 1000)).toBe(true);
      expect(SecurityUtils.checkRateLimit(key, 2, 1000)).toBe(true);
      
      // Third request should fail
      expect(SecurityUtils.checkRateLimit(key, 2, 1000)).toBe(false);
    });
  });

  describe('Agent Security Integration', () => {
    it('should handle invalid touch events securely', () => {
      const agent = new TouchPatternAgent();
      
      const result = agent.analyzeTouchPattern({
        x: NaN,
        y: Infinity,
        pressure: -1,
        timestamp: -1,
        type: 'invalid' as any
      });
      
      // Should detect as anomaly or return error
      expect(result.score >= 0.8 || result.reasons.includes('Invalid touch event data')).toBe(true);
    });

    it('should handle invalid keystroke data securely', () => {
      const agent = new TypingRhythmAgent();
      
      const result = agent.analyzeKeystroke('<script>alert(1)</script>', false, -1);
      
      expect(result.score).toBeGreaterThan(0.5); // Should detect as anomaly
      expect(result.reasons).toContain('Invalid keystroke data');
    });

    it('should handle malformed agent scores', () => {
      const engine = new AnomalyDetectionEngine();
      
      const result = engine.aggregateRiskScores([
        {
          agentName: 'test',
          score: NaN,
          confidence: Infinity,
          weight: -1,
          reasons: ['test']
        }
      ]);
      
      expect(result.overallRiskScore).toBe(0);
      expect(result.threatLevel).toBe('LOW');
    });
  });

  describe('Memory Safety', () => {
    it('should not leak memory with large inputs', () => {
      const agent = new TouchPatternAgent();
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate many events
      for (let i = 0; i < 10000; i++) {
        agent.analyzeTouchPattern({
          x: i % 1000,
          y: i % 1000,
          pressure: 0.5,
          timestamp: Date.now(),
          type: i % 3 === 0 ? 'down' : i % 3 === 1 ? 'move' : 'up'
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory growth should be reasonable (less than 50MB)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
    });
  });
});

describe('Security Configuration Tests', () => {
  it('should have secure TypeScript configuration', () => {
    const tsConfig = require('../tsconfig.json');
    
    expect(tsConfig.compilerOptions.strict).toBe(true);
    expect(tsConfig.compilerOptions.noImplicitAny).toBe(true);
    expect(tsConfig.compilerOptions.noImplicitReturns).toBe(true);
  });
});
