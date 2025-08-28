import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { TouchPatternAgent } from './src/agents/TouchPatternAgent';
import { TypingRhythmAgent } from './src/agents/TypingRhythmAgent';
import { AnomalyDetectionEngine } from './src/agents/AnomalyDetectionEngine';
import TouchMonitor from './src/components/TouchMonitor';
import TypingMonitor from './src/components/TypingMonitor';
import MotionSensor from './src/components/MotionSensor';

const App = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  const [threatLevel, setThreatLevel] = useState('LOW');
  const [detectedAnomalies, setDetectedAnomalies] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState({
    touchPattern: 'Inactive',
    typingRhythm: 'Inactive',
    anomalyEngine: 'Inactive',
  });

  // Initialize agents
  const touchAgent = useRef(new TouchPatternAgent());
  const typingAgent = useRef(new TypingRhythmAgent());
  const anomalyEngine = useRef(new AnomalyDetectionEngine());
  
  // Real-time risk calculation
  const riskHistory = useRef<number[]>([]);
  const anomalyBuffer = useRef<{score: number, reasons: string[], timestamp: number}[]>([]);

  useEffect(() => {
    if (isMonitoring) {
      setAgentStatus({
        touchPattern: 'Active - Monitoring Touch Patterns',
        typingRhythm: 'Active - Analyzing Keystroke Dynamics',
        anomalyEngine: 'Active - Calculating Risk Scores',
      });
      
      // Start real-time risk calculation
      const riskInterval = setInterval(calculateRealTimeRisk, 2000); // Every 2 seconds
      
      return () => clearInterval(riskInterval);
    } else {
      setAgentStatus({
        touchPattern: 'Inactive',
        typingRhythm: 'Inactive',
        anomalyEngine: 'Inactive',
      });
      setRiskScore(0);
      setThreatLevel('LOW');
      setDetectedAnomalies([]);
      riskHistory.current = [];
      anomalyBuffer.current = [];
    }
  }, [isMonitoring]);

  const calculateRealTimeRisk = () => {
    const now = Date.now();
    const recentAnomalies = anomalyBuffer.current.filter(
      anomaly => now - anomaly.timestamp < 30000 // Last 30 seconds
    );

    if (recentAnomalies.length === 0) {
      setRiskScore(0);
      setThreatLevel('LOW');
      return;
    }

    // Calculate weighted average of recent anomalies
    const totalScore = recentAnomalies.reduce((sum, anomaly) => {
      const age = now - anomaly.timestamp;
      const weight = Math.max(0, 1 - (age / 30000)); // Decay over 30 seconds
      return sum + (anomaly.score * weight);
    }, 0);

    const averageScore = totalScore / recentAnomalies.length;
    const smoothedScore = smoothRiskScore(averageScore);
    
    setRiskScore(smoothedScore);
    setThreatLevel(calculateThreatLevel(smoothedScore));
    
    // Update detected anomalies
    const uniqueReasons = [...new Set(recentAnomalies.flatMap(a => a.reasons))];
    setDetectedAnomalies(uniqueReasons.slice(0, 3)); // Show top 3 reasons
  };

  const smoothRiskScore = (newScore: number): number => {
    riskHistory.current.push(newScore);
    if (riskHistory.current.length > 10) {
      riskHistory.current.shift(); // Keep last 10 scores
    }
    
    // Exponential moving average
    const alpha = 0.3;
    let smoothed = riskHistory.current[0];
    for (let i = 1; i < riskHistory.current.length; i++) {
      smoothed = alpha * riskHistory.current[i] + (1 - alpha) * smoothed;
    }
    
    return Math.min(Math.max(smoothed, 0), 1);
  };

  const calculateThreatLevel = (score: number): string => {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  };

  const handleAnomalyDetected = (score: number, reasons: string[]) => {
    if (!isMonitoring) return;
    
    // Add to anomaly buffer
    anomalyBuffer.current.push({
      score,
      reasons,
      timestamp: Date.now(),
    });
    
    // Keep buffer manageable
    if (anomalyBuffer.current.length > 50) {
      anomalyBuffer.current = anomalyBuffer.current.slice(-30);
    }
    
    // Immediate high-risk alert
    if (score > 0.8) {
      Alert.alert(
        '🚨 Critical Threat Detected',
        `High-risk anomaly detected: ${reasons.join(', ')}`,
        [{ text: 'Acknowledge', style: 'destructive' }]
      );
    }
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      Alert.alert(
        'Security Shield Activated',
        'Samsung Security Shield is now monitoring for fraudulent behavior in real-time. Touch the screen, type in the text field, and move the device to see live analysis.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Security Shield Deactivated',
        'Real-time monitoring has been stopped.',
        [{ text: 'OK' }]
      );
    }
  };

  const runDemo = () => {
    if (!isMonitoring) {
      Alert.alert('Start Monitoring First', 'Please activate monitoring before running the demo.');
      return;
    }
    
    Alert.alert(
      'Demo Mode',
      'Simulating various fraud scenarios with real-time detection...',
      [{ text: 'OK' }]
    );
    
    // Simulate a series of suspicious activities
    setTimeout(() => {
      handleAnomalyDetected(0.7, ['Robotic touch patterns detected', 'Unusual pressure consistency']);
    }, 1000);
    
    setTimeout(() => {
      handleAnomalyDetected(0.8, ['Automated typing rhythm identified', 'Perfect keystroke timing']);
    }, 3000);
    
    setTimeout(() => {
      handleAnomalyDetected(0.6, ['Suspicious device movement pattern', 'Mechanical motion detected']);
    }, 5000);
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '#d32f2f';
      case 'HIGH': return '#f57c00';
      case 'MEDIUM': return '#fbc02d';
      case 'LOW': return '#388e3c';
      default: return '#757575';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Touch monitoring overlay */}
      <TouchMonitor
        isMonitoring={isMonitoring}
        onAnomalyDetected={handleAnomalyDetected}
        touchAgent={touchAgent.current}
      />
      
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>🛡️ Samsung Security Shield</Text>
          <Text style={styles.subtitle}>Multi-Agent Fraud Detection System</Text>
          {isMonitoring && (
            <Text style={styles.liveIndicator}>🔴 LIVE MONITORING</Text>
          )}
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Security Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Monitoring:</Text>
            <Text style={[styles.statusValue, { color: isMonitoring ? '#388e3c' : '#757575' }]}>
              {isMonitoring ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Risk Score:</Text>
            <Text style={[styles.statusValue, { color: getThreatColor(threatLevel) }]}>
              {(riskScore * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Threat Level:</Text>
            <Text style={[styles.statusValue, { color: getThreatColor(threatLevel) }]}>
              {threatLevel}
            </Text>
          </View>
          
          {detectedAnomalies.length > 0 && (
            <View style={styles.anomaliesSection}>
              <Text style={styles.anomaliesTitle}>Recent Anomalies:</Text>
              {detectedAnomalies.map((anomaly, index) => (
                <Text key={index} style={styles.anomalyText}>• {anomaly}</Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.agentsCard}>
          <Text style={styles.cardTitle}>Agent Status</Text>
          
          <View style={styles.agentRow}>
            <Text style={styles.agentName}>🔍 Touch Pattern Agent</Text>
            <Text style={[styles.agentStatus, { color: isMonitoring ? '#388e3c' : '#757575' }]}>
              {agentStatus.touchPattern}
            </Text>
          </View>
          
          <View style={styles.agentRow}>
            <Text style={styles.agentName}>⌨️ Typing Rhythm Agent</Text>
            <Text style={[styles.agentStatus, { color: isMonitoring ? '#388e3c' : '#757575' }]}>
              {agentStatus.typingRhythm}
            </Text>
          </View>
          
          <View style={styles.agentRow}>
            <Text style={styles.agentName}>🚨 Anomaly Detection Engine</Text>
            <Text style={[styles.agentStatus, { color: isMonitoring ? '#388e3c' : '#757575' }]}>
              {agentStatus.anomalyEngine}
            </Text>
          </View>
        </View>

        {/* Real-time input monitoring */}
        <TypingMonitor
          isMonitoring={isMonitoring}
          onAnomalyDetected={handleAnomalyDetected}
          typingAgent={typingAgent.current}
        />

        {/* Motion sensor data */}
        <MotionSensor
          isMonitoring={isMonitoring}
          onAnomalyDetected={handleAnomalyDetected}
        />

        <View style={styles.controlsCard}>
          <TouchableOpacity
            style={[styles.button, isMonitoring ? styles.stopButton : styles.startButton]}
            onPress={toggleMonitoring}
          >
            <Text style={styles.buttonText}>
              {isMonitoring ? 'Stop Real-Time Monitoring' : 'Start Real-Time Monitoring'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoButton} onPress={runDemo}>
            <Text style={styles.buttonText}>Run Fraud Simulation</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Live Detection Features</Text>
          <Text style={styles.infoText}>
            🔴 <Text style={styles.boldText}>Real-Time Analysis:</Text> Touch patterns, typing rhythm, and device motion are analyzed continuously.
          </Text>
          <Text style={styles.infoText}>
            🛡️ <Text style={styles.boldText}>Privacy Protection:</Text> All processing happens locally on your device.
          </Text>
          <Text style={styles.infoText}>
            ⚡ <Text style={styles.boldText}>Instant Detection:</Text> Anomalies are detected within seconds of occurrence.
          </Text>
          <Text style={styles.infoText}>
            🎯 <Text style={styles.boldText}>Multi-Agent Coordination:</Text> Three specialized agents work together for comprehensive fraud detection.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  liveIndicator: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: 'bold',
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  agentsCard: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  controlsCard: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  anomaliesSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fff3e0',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#f57c00',
  },
  anomaliesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 5,
  },
  anomalyText: {
    fontSize: 12,
    color: '#bf360c',
    marginBottom: 2,
  },
  agentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  agentName: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  agentStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#388e3c',
  },
  stopButton: {
    backgroundColor: '#d32f2f',
  },
  demoButton: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333333',
  },
});

export default App;