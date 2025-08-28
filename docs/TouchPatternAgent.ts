/**
 * Touch Pattern Agent
 * Analyzes touch behavior patterns for fraud detection
 */

import { SecurityUtils } from '../utils/SecurityUtils';

export interface TouchEvent {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
  type: 'down' | 'move' | 'up';
}

export interface AnomalyScore {
  score: number; // 0-1 scale
  confidence: number;
  reasons: string[];
}

export class TouchPatternAgent {
  private touchBuffer: TouchEvent[] = [];
  private readonly maxBufferSize = 100;
  private readonly rateLimitKey = 'touch_analysis';
  private readonly maxAnalysisPerSecond = 50;
  
  constructor() {
    this.initializeModel();
  }

  private initializeModel(): void {
    // Initialize neural network model for touch pattern analysis
    SecurityUtils.secureLog('TouchPatternAgent: Model initialized');
  }

  public analyzeTouchPattern(touchEvent: TouchEvent): AnomalyScore {
    try {
      // Rate limiting to prevent DoS
      if (!SecurityUtils.checkRateLimit(this.rateLimitKey + '_' + Date.now().toString().slice(-3), this.maxAnalysisPerSecond, 1000)) {
        return { score: 0, confidence: 0, reasons: ['Rate limit exceeded'] };
      }

      // Input validation
      if (!this.validateTouchEvent(touchEvent)) {
        return { score: 0.9, confidence: 0.8, reasons: ['Invalid touch event data'] };
      }

      // Secure buffer management
      SecurityUtils.boundedArrayPush(this.touchBuffer, touchEvent, this.maxBufferSize);

      // Analyze current touch event
      const pressureAnomaly = this.detectPressureAnomaly(touchEvent);
      const velocityAnomaly = this.detectVelocityAnomaly(touchEvent);
      const patternAnomaly = this.detectPatternAnomaly();

      // Combine scores with bounds checking
      const score = SecurityUtils.boundedNumber(
        (pressureAnomaly + velocityAnomaly + patternAnomaly) / 3,
        0, 1
      );
      const confidence = this.calculateConfidence(score);
      
      return {
        score,
        confidence,
        reasons: this.generateReasons(pressureAnomaly, velocityAnomaly, patternAnomaly)
      };
    } catch (error) {
      SecurityUtils.secureLog('Error in analyzeTouchPattern', error);
      return { score: 0, confidence: 0, reasons: ['Analysis error'] };
    }
  }

  private validateTouchEvent(event: TouchEvent): boolean {
    return (
      SecurityUtils.validateCoordinates(event.x, event.y) &&
      SecurityUtils.validatePressure(event.pressure) &&
      SecurityUtils.validateTimestamp(event.timestamp) &&
      ['down', 'move', 'up'].includes(event.type)
    );
  }

  private detectPressureAnomaly(event: TouchEvent): number {
    // Detect unusual pressure patterns that might indicate bot behavior
    const avgPressure = 0.5; // Normal pressure baseline
    const deviation = Math.abs(event.pressure - avgPressure);
    return Math.min(deviation * 2, 1.0);
  }

  private detectVelocityAnomaly(event: TouchEvent): number {
    if (this.touchBuffer.length < 2) return 0;
    
    const prev = this.touchBuffer[this.touchBuffer.length - 2];
    const distance = Math.sqrt(
      Math.pow(event.x - prev.x, 2) + Math.pow(event.y - prev.y, 2)
    );
    const timeDelta = event.timestamp - prev.timestamp;
    
    // SECURITY FIX: Safe division to prevent division by zero
    const velocity = SecurityUtils.safeDivision(distance, timeDelta, 0);
    
    // Flag unusually high or low velocities
    const normalVelocity = 200; // pixels per second
    const deviation = SecurityUtils.safeDivision(
      Math.abs(velocity - normalVelocity), 
      normalVelocity, 
      0
    );
    
    return SecurityUtils.boundedNumber(deviation, 0, 1.0);
  }

  private detectPatternAnomaly(): number {
    if (this.touchBuffer.length < 10) return 0;
    
    // Analyze recent touch patterns for robotic behavior
    const recentEvents = this.touchBuffer.slice(-10);
    let regularityScore = 0;
    
    // Check for overly regular timing patterns (bot-like)
    const intervals = recentEvents.slice(1).map((event, i) => 
      event.timestamp - recentEvents[i].timestamp
    );
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    // Low variance indicates robotic behavior
    if (variance < 100) {
      regularityScore = 0.8;
    }
    
    return regularityScore;
  }

  private calculateConfidence(score: number): number {
    // Higher scores should have higher confidence
    return Math.min(score + 0.3, 1.0);
  }

  private generateReasons(pressure: number, velocity: number, pattern: number): string[] {
    const reasons: string[] = [];
    
    if (pressure > 0.5) {
      reasons.push('Unusual pressure pattern detected');
    }
    if (velocity > 0.5) {
      reasons.push('Abnormal touch velocity');
    }
    if (pattern > 0.5) {
      reasons.push('Robotic touch patterns detected');
    }
    
    return reasons;
  }

  public getStatus(): { active: boolean; bufferSize: number } {
    return {
      active: true,
      bufferSize: this.touchBuffer.length
    };
  }
}
