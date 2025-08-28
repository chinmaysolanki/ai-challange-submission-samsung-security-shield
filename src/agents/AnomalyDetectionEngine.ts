/**
 * Anomaly Detection Engine
 * Aggregates risk scores from all agents and provides final threat assessment
 */

import { AnomalyScore } from './TouchPatternAgent';
import { SecurityUtils } from '../utils/SecurityUtils';

export interface AgentScore {
  agentName: string;
  score: number;
  confidence: number;
  weight: number;
  reasons: string[];
}

export interface ThreatAssessment {
  overallRiskScore: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  primaryConcerns: string[];
  recommendations: string[];
  timestamp: number;
}

export class AnomalyDetectionEngine {
  private readonly agentWeights = {
    touchPattern: 0.3,
    typingRhythm: 0.25,
    movementBehavior: 0.25,
    appUsage: 0.2
  };

  private riskHistory: number[] = [];
  private readonly historyLimit = 20;

  constructor() {
    SecurityUtils.secureLog('AnomalyDetectionEngine: Ensemble model initialized');
  }

  public aggregateRiskScores(agentScores: AgentScore[]): ThreatAssessment {
    try {
      // Input validation
      if (!Array.isArray(agentScores) || agentScores.length === 0) {
        return this.createEmptyThreatAssessment();
      }

      // Calculate weighted risk score with overflow protection
      let totalScore = 0;
      let totalWeight = 0;
      let totalConfidence = 0;
      const allReasons: string[] = [];

      for (const agent of agentScores) {
        // Validate agent data
        if (!this.validateAgentScore(agent)) {
          SecurityUtils.secureLog('Invalid agent score detected', { agentName: agent.agentName });
          continue;
        }

        const boundedScore = SecurityUtils.boundedNumber(agent.score, 0, 1);
        const boundedWeight = SecurityUtils.boundedNumber(agent.weight, 0, 1);
        const boundedConfidence = SecurityUtils.boundedNumber(agent.confidence, 0, 1);

        const weightedScore = boundedScore * boundedWeight;
        totalScore = SecurityUtils.boundedNumber(totalScore + weightedScore, 0, 100);
        totalWeight = SecurityUtils.boundedNumber(totalWeight + boundedWeight, 0, 100);
        totalConfidence = SecurityUtils.boundedNumber(totalConfidence + (boundedConfidence * boundedWeight), 0, 100);
        
        // Limit reasons to prevent memory exhaustion
        if (allReasons.length < 50) {
          allReasons.push(...agent.reasons.slice(0, 10));
        }
      }

      const normalizedScore = SecurityUtils.safeDivision(totalScore, totalWeight, 0);
      const normalizedConfidence = SecurityUtils.safeDivision(totalConfidence, totalWeight, 0);

      // Apply temporal smoothing
      const smoothedScore = this.applyTemporalSmoothing(normalizedScore);
      
      // Determine threat level
      const threatLevel = this.calculateThreatLevel(smoothedScore);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(smoothedScore, allReasons);
      
      // Get primary concerns
      const primaryConcerns = this.extractPrimaryConcerns(allReasons, smoothedScore);

      return {
        overallRiskScore: SecurityUtils.boundedNumber(smoothedScore, 0, 1),
        threatLevel,
        confidence: SecurityUtils.boundedNumber(normalizedConfidence, 0, 1),
        primaryConcerns,
        recommendations,
        timestamp: Date.now()
      };
    } catch (error) {
      SecurityUtils.secureLog('Error in aggregateRiskScores', error);
      return this.createEmptyThreatAssessment();
    }
  }

  private validateAgentScore(agent: AgentScore): boolean {
    return (
      typeof agent.agentName === 'string' &&
      typeof agent.score === 'number' &&
      typeof agent.confidence === 'number' &&
      typeof agent.weight === 'number' &&
      Array.isArray(agent.reasons) &&
      !isNaN(agent.score) &&
      !isNaN(agent.confidence) &&
      !isNaN(agent.weight) &&
      isFinite(agent.score) &&
      isFinite(agent.confidence) &&
      isFinite(agent.weight)
    );
  }

  private createEmptyThreatAssessment(): ThreatAssessment {
    return {
      overallRiskScore: 0,
      threatLevel: 'LOW',
      confidence: 0,
      primaryConcerns: [],
      recommendations: ['Unable to assess threat'],
      timestamp: Date.now()
    };
  }

  private applyTemporalSmoothing(currentScore: number): number {
    this.riskHistory.push(currentScore);
    
    // Keep history within limit
    if (this.riskHistory.length > this.historyLimit) {
      this.riskHistory.shift();
    }

    // Apply exponential moving average
    if (this.riskHistory.length === 1) {
      return currentScore;
    }

    const alpha = 0.3; // Smoothing factor
    let smoothed = this.riskHistory[0];
    
    for (let i = 1; i < this.riskHistory.length; i++) {
      smoothed = alpha * this.riskHistory[i] + (1 - alpha) * smoothed;
    }

    return smoothed;
  }

  private calculateThreatLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(score: number, reasons: string[]): string[] {
    const recommendations: string[] = [];

    if (score >= 0.8) {
      recommendations.push('Immediate security verification required');
      recommendations.push('Consider blocking suspicious actions');
      recommendations.push('Alert security team');
    } else if (score >= 0.6) {
      recommendations.push('Enhanced monitoring recommended');
      recommendations.push('Request additional authentication');
    } else if (score >= 0.4) {
      recommendations.push('Continue monitoring user behavior');
      recommendations.push('Log activity for review');
    } else {
      recommendations.push('Normal operation - continue monitoring');
    }

    // Add specific recommendations based on detected issues
    if (reasons.some(r => r.includes('robotic') || r.includes('bot'))) {
      recommendations.push('Implement CAPTCHA verification');
    }
    
    if (reasons.some(r => r.includes('pressure') || r.includes('touch'))) {
      recommendations.push('Verify device authenticity');
    }

    return recommendations;
  }

  private extractPrimaryConcerns(reasons: string[], score: number): string[] {
    // Group similar reasons and prioritize by frequency and severity
    const concernCounts = new Map<string, number>();
    
    for (const reason of reasons) {
      const key = this.categorizeReason(reason);
      concernCounts.set(key, (concernCounts.get(key) || 0) + 1);
    }

    // Sort by frequency and filter by score threshold
    const sortedConcerns = Array.from(concernCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .filter(([_, count]) => count >= 2 || score > 0.6)
      .map(([concern, _]) => concern)
      .slice(0, 3); // Top 3 concerns

    return sortedConcerns.length > 0 ? sortedConcerns : ['Behavioral anomalies detected'];
  }

  private categorizeReason(reason: string): string {
    if (reason.includes('robotic') || reason.includes('bot')) {
      return 'Automated behavior detected';
    }
    if (reason.includes('pressure') || reason.includes('touch')) {
      return 'Suspicious touch patterns';
    }
    if (reason.includes('typing') || reason.includes('keystroke')) {
      return 'Unusual typing behavior';
    }
    if (reason.includes('movement') || reason.includes('motion')) {
      return 'Abnormal device movement';
    }
    if (reason.includes('app') || reason.includes('usage')) {
      return 'Suspicious app interactions';
    }
    return 'General behavioral anomaly';
  }

  public getRiskTrend(): {
    current: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
  } {
    if (this.riskHistory.length < 5) {
      return { current: 0, trend: 'stable', volatility: 0 };
    }

    const recent = this.riskHistory.slice(-5);
    const older = this.riskHistory.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? 
      older.reduce((a, b) => a + b, 0) / older.length : recentAvg;

    const diff = recentAvg - olderAvg;
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    
    if (diff > 0.1) trend = 'increasing';
    else if (diff < -0.1) trend = 'decreasing';

    // Calculate volatility
    const variance = recent.reduce((sum, val) => 
      sum + Math.pow(val - recentAvg, 2), 0) / recent.length;
    const volatility = Math.sqrt(variance);

    return {
      current: recentAvg,
      trend,
      volatility
    };
  }

  public getEngineStatus(): {
    active: boolean;
    historySize: number;
    lastAssessment: number;
  } {
    return {
      active: true,
      historySize: this.riskHistory.length,
      lastAssessment: Date.now()
    };
  }
}
