import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SecurityUtils } from '../utils/SecurityUtils';

interface MotionData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface MotionSensorProps {
  isMonitoring: boolean;
  onAnomalyDetected: (score: number, reasons: string[]) => void;
}

const MotionSensor: React.FC<MotionSensorProps> = ({
  isMonitoring,
  onAnomalyDetected,
}) => {
  const [accelerometerData, setAccelerometerData] = useState<MotionData | null>(null);
  const [gyroscopeData, setGyroscopeData] = useState<MotionData | null>(null);
  const [motionHistory, setMotionHistory] = useState<MotionData[]>([]);

  useEffect(() => {
    if (!isMonitoring) return;

    // Simulate accelerometer data (in real app, would use react-native-sensors)
    const accelerometerInterval = setInterval(() => {
      const data: MotionData = {
        x: SecurityUtils.secureRandomInRange(-1, 1),
        y: SecurityUtils.secureRandomInRange(-1, 1),
        z: SecurityUtils.secureRandomInRange(8.8, 10.8), // Include gravity with variation
        timestamp: Date.now(),
      };
      
      setAccelerometerData(data);
      
      // Add to motion history
      setMotionHistory(prev => {
        const newHistory = [...prev, data].slice(-20); // Keep last 20 readings
        
        // Analyze motion patterns for anomalies
        if (newHistory.length >= 10) {
          const anomalyScore = analyzeMotionPattern(newHistory);
          if (anomalyScore > 0.4) {
            onAnomalyDetected(anomalyScore, ['Unusual device movement pattern detected']);
          }
        }
        
        return newHistory;
      });
    }, 100); // 10Hz sampling

    // Simulate gyroscope data
    const gyroscopeInterval = setInterval(() => {
      const data: MotionData = {
        x: SecurityUtils.secureRandomInRange(-0.05, 0.05), // Rotation rate in rad/s
        y: SecurityUtils.secureRandomInRange(-0.05, 0.05),
        z: SecurityUtils.secureRandomInRange(-0.05, 0.05),
        timestamp: Date.now(),
      };
      
      setGyroscopeData(data);
    }, 100);

    return () => {
      clearInterval(accelerometerInterval);
      clearInterval(gyroscopeInterval);
    };
  }, [isMonitoring, onAnomalyDetected]);

  const analyzeMotionPattern = (history: MotionData[]): number => {
    // Calculate motion variance
    const xValues = history.map(d => d.x);
    const yValues = history.map(d => d.y);
    const zValues = history.map(d => d.z);
    
    const xVariance = calculateVariance(xValues);
    const yVariance = calculateVariance(yValues);
    const zVariance = calculateVariance(zValues);
    
    // Check for suspicious patterns
    let anomalyScore = 0;
    
    // Very low variance might indicate the device is mounted/fixed (bot behavior)
    if (xVariance < 0.01 && yVariance < 0.01 && zVariance < 0.01) {
      anomalyScore += 0.6;
    }
    
    // Very high variance might indicate shaking/manipulation
    if (xVariance > 4 || yVariance > 4 || zVariance > 4) {
      anomalyScore += 0.4;
    }
    
    // Check for regular periodic motion (automated movement)
    const isPeriodicX = isPeriodicPattern(xValues);
    const isPeriodicY = isPeriodicPattern(yValues);
    
    if (isPeriodicX && isPeriodicY) {
      anomalyScore += 0.5;
    }
    
    return Math.min(anomalyScore, 1.0);
  };

  const calculateVariance = (values: number[]): number => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const isPeriodicPattern = (values: number[]): boolean => {
    // Simple check for periodic patterns
    if (values.length < 8) return false;
    
    const firstHalf = values.slice(0, values.length / 2);
    const secondHalf = values.slice(values.length / 2);
    
    // Check if patterns repeat
    let similarity = 0;
    for (let i = 0; i < Math.min(firstHalf.length, secondHalf.length); i++) {
      if (Math.abs(firstHalf[i] - secondHalf[i]) < 0.1) {
        similarity++;
      }
    }
    
    return similarity / Math.min(firstHalf.length, secondHalf.length) > 0.8;
  };

  if (!isMonitoring) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Motion Sensor</Text>
        <Text style={styles.inactiveText}>Motion monitoring inactive</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Motion Sensor Data</Text>
      
      <View style={styles.sensorSection}>
        <Text style={styles.sensorTitle}>Accelerometer</Text>
        {accelerometerData && (
          <View>
            <Text style={styles.dataText}>X: {accelerometerData.x.toFixed(3)}</Text>
            <Text style={styles.dataText}>Y: {accelerometerData.y.toFixed(3)}</Text>
            <Text style={styles.dataText}>Z: {accelerometerData.z.toFixed(3)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.sensorSection}>
        <Text style={styles.sensorTitle}>Gyroscope</Text>
        {gyroscopeData && (
          <View>
            <Text style={styles.dataText}>X: {gyroscopeData.x.toFixed(3)} rad/s</Text>
            <Text style={styles.dataText}>Y: {gyroscopeData.y.toFixed(3)} rad/s</Text>
            <Text style={styles.dataText}>Z: {gyroscopeData.z.toFixed(3)} rad/s</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.historyText}>
        Motion History: {motionHistory.length} samples
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  sensorSection: {
    marginBottom: 15,
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 8,
  },
  dataText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'monospace',
  },
  historyText: {
    fontSize: 12,
    color: '#888888',
    marginTop: 10,
    fontStyle: 'italic',
  },
  inactiveText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
});

export default MotionSensor;
