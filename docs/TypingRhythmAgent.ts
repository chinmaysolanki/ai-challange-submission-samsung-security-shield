/**
 * Typing Rhythm Agent
 * Analyzes keystroke dynamics for fraud detection
 */

import { SecurityUtils } from '../utils/SecurityUtils';

export interface KeystrokeEvent {
  key: string;
  dwellTime: number; // Time key was pressed down
  flightTime: number; // Time between this key and previous key
  timestamp: number;
  isDown: boolean;
}

export class TypingRhythmAgent {
  private keystrokeBuffer: KeystrokeEvent[] = [];
  private keyDownTimes: Map<string, number> = new Map();
  private lastKeyUpTime = 0;
  private readonly maxBufferSize = 50;
  private readonly rateLimitKey = 'keystroke_analysis';
  private readonly maxAnalysisPerSecond = 30;

  constructor() {
    this.initializeModel();
  }

  private initializeModel(): void {
    SecurityUtils.secureLog('TypingRhythmAgent: Gaussian Mixture Model initialized');
  }

  public analyzeKeystroke(key: string, isDown: boolean, timestamp: number): AnomalyScore {
    try {
      // Rate limiting
      if (!SecurityUtils.checkRateLimit(this.rateLimitKey, this.maxAnalysisPerSecond, 1000)) {
        return { score: 0, confidence: 0, reasons: ['Rate limit exceeded'] };
      }

      // Input validation
      const sanitizedKey = SecurityUtils.sanitizeString(key);
      if (!sanitizedKey || !SecurityUtils.validateTimestamp(timestamp)) {
        return { score: 0.8, confidence: 0.7, reasons: ['Invalid keystroke data'] };
      }

      if (isDown) {
        this.keyDownTimes.set(sanitizedKey, timestamp);
        return { score: 0, confidence: 0, reasons: [] };
      }

      // Key up event
      const downTime = this.keyDownTimes.get(sanitizedKey);
      if (!downTime) {
        return { score: 0, confidence: 0, reasons: [] };
      }

      const dwellTime = SecurityUtils.boundedNumber(timestamp - downTime, 0, 5000);
      const flightTime = this.lastKeyUpTime > 0 ? 
        SecurityUtils.boundedNumber(downTime - this.lastKeyUpTime, 0, 10000) : 0;

      const keystroke: KeystrokeEvent = {
        key: sanitizedKey,
        dwellTime,
        flightTime,
        timestamp,
        isDown: false
      };

      // Secure buffer management
      SecurityUtils.boundedArrayPush(this.keystrokeBuffer, keystroke, this.maxBufferSize);
      this.lastKeyUpTime = timestamp;

      return this.detectTypingAnomalies(keystroke);
    } catch (error) {
      SecurityUtils.secureLog('Error in analyzeKeystroke', error);
      return { score: 0, confidence: 0, reasons: ['Analysis error'] };
    }
  }

  private detectTypingAnomalies(keystroke: KeystrokeEvent): AnomalyScore {
    if (this.keystrokeBuffer.length < 5) {
      return { score: 0, confidence: 0, reasons: [] };
    }

    const dwellAnomaly = this.detectDwellTimeAnomaly(keystroke);
    const flightAnomaly = this.detectFlightTimeAnomaly(keystroke);
    const rhythmAnomaly = this.detectRhythmAnomaly();

    const score = (dwellAnomaly + flightAnomaly + rhythmAnomaly) / 3;
    const confidence = Math.min(score + 0.2, 1.0);

    return {
      score,
      confidence,
      reasons: this.generateReasons(dwellAnomaly, flightAnomaly, rhythmAnomaly)
    };
  }

  private detectDwellTimeAnomaly(keystroke: KeystrokeEvent): number {
    // Normal dwell time is 80-120ms for most users
    const normalDwellTime = 100;
    const deviation = Math.abs(keystroke.dwellTime - normalDwellTime);
    
    // Very short or very long dwell times are suspicious
    if (keystroke.dwellTime < 30 || keystroke.dwellTime > 300) {
      return 0.8;
    }
    
    return Math.min(deviation / normalDwellTime, 1.0);
  }

  private detectFlightTimeAnomaly(keystroke: KeystrokeEvent): number {
    if (keystroke.flightTime === 0) return 0;
    
    // Normal flight time varies but extremely consistent timing is suspicious
    const recentFlightTimes = this.keystrokeBuffer
      .slice(-10)
      .map(k => k.flightTime)
      .filter(t => t > 0);
    
    if (recentFlightTimes.length < 3) return 0;
    
    const avg = recentFlightTimes.reduce((a, b) => a + b, 0) / recentFlightTimes.length;
    const variance = recentFlightTimes.reduce((sum, time) => 
      sum + Math.pow(time - avg, 2), 0) / recentFlightTimes.length;
    
    // Very low variance indicates robotic typing
    if (variance < 50) {
      return 0.9;
    }
    
    return 0;
  }

  private detectRhythmAnomaly(): number {
    const recent = this.keystrokeBuffer.slice(-20);
    if (recent.length < 10) return 0;
    
    // Check for patterns that indicate automated typing
    let patternScore = 0;
    
    // 1. Check for identical inter-key intervals
    const intervals = recent.map(k => k.flightTime).filter(t => t > 0);
    const uniqueIntervals = new Set(intervals);
    
    if (intervals.length > 5 && uniqueIntervals.size < 3) {
      patternScore += 0.7; // Too few unique intervals
    }
    
    // 2. Check for mechanical consistency in dwell times
    const dwellTimes = recent.map(k => k.dwellTime);
    const dwellVariance = this.calculateVariance(dwellTimes);
    
    if (dwellVariance < 25) {
      patternScore += 0.6; // Too consistent
    }
    
    return Math.min(patternScore, 1.0);
  }

  private calculateVariance(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  }

  private generateReasons(dwell: number, flight: number, rhythm: number): string[] {
    const reasons: string[] = [];
    
    if (dwell > 0.5) {
      reasons.push('Unusual keystroke timing detected');
    }
    if (flight > 0.5) {
      reasons.push('Suspicious inter-key intervals');
    }
    if (rhythm > 0.5) {
      reasons.push('Robotic typing pattern identified');
    }
    
    return reasons;
  }

  public getTypingProfile(): {
    avgDwellTime: number;
    avgFlightTime: number;
    consistency: number;
  } {
    if (this.keystrokeBuffer.length === 0) {
      return { avgDwellTime: 0, avgFlightTime: 0, consistency: 0 };
    }

    const dwellTimes = this.keystrokeBuffer.map(k => k.dwellTime);
    const flightTimes = this.keystrokeBuffer.map(k => k.flightTime).filter(t => t > 0);
    
    const avgDwellTime = dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length;
    const avgFlightTime = flightTimes.length > 0 ? 
      flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0;
    
    const consistency = 1 - (this.calculateVariance(dwellTimes) / 10000);
    
    return {
      avgDwellTime,
      avgFlightTime,
      consistency: Math.max(0, Math.min(1, consistency))
    };
  }
}
