import React, { useRef, useEffect } from 'react';
import { View, PanResponder, Dimensions, StyleSheet } from 'react-native';
import { TouchPatternAgent, TouchEvent } from '../agents/TouchPatternAgent';

interface TouchMonitorProps {
  isMonitoring: boolean;
  onAnomalyDetected: (score: number, reasons: string[]) => void;
  touchAgent: TouchPatternAgent;
}

const TouchMonitor: React.FC<TouchMonitorProps> = ({
  isMonitoring,
  onAnomalyDetected,
  touchAgent,
}) => {
  const lastTouchTime = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const { width, height } = Dimensions.get('window');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isMonitoring,
      onMoveShouldSetPanResponder: () => isMonitoring,
      onPanResponderGrant: (evt) => {
        if (!isMonitoring) return;
        
        const timestamp = Date.now();
        touchStartTime.current = timestamp;
        
        const touchEvent: TouchEvent = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          pressure: evt.nativeEvent.force || 0.5, // Default pressure if not available
          timestamp,
          type: 'down',
        };
        
        const result = touchAgent.analyzeTouchPattern(touchEvent);
        
        if (result.score > 0.3) { // Threshold for anomaly
          onAnomalyDetected(result.score, result.reasons);
        }
      },
      onPanResponderMove: (evt) => {
        if (!isMonitoring) return;
        
        const timestamp = Date.now();
        const touchEvent: TouchEvent = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          pressure: evt.nativeEvent.force || 0.5,
          timestamp,
          type: 'move',
        };
        
        const result = touchAgent.analyzeTouchPattern(touchEvent);
        
        if (result.score > 0.3) {
          onAnomalyDetected(result.score, result.reasons);
        }
      },
      onPanResponderRelease: (evt) => {
        if (!isMonitoring) return;
        
        const timestamp = Date.now();
        const touchEvent: TouchEvent = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          pressure: 0,
          timestamp,
          type: 'up',
        };
        
        const result = touchAgent.analyzeTouchPattern(touchEvent);
        
        if (result.score > 0.3) {
          onAnomalyDetected(result.score, result.reasons);
        }
        
        lastTouchTime.current = timestamp;
      },
    })
  ).current;

  return (
    <View
      style={[styles.touchArea, { width, height }]}
      {...panResponder.panHandlers}
    />
  );
};

const styles = StyleSheet.create({
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1, // Behind other components
  },
});

export default TouchMonitor;
