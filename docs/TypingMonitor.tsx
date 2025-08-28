import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { TypingRhythmAgent } from '../agents/TypingRhythmAgent';

interface TypingMonitorProps {
  isMonitoring: boolean;
  onAnomalyDetected: (score: number, reasons: string[]) => void;
  typingAgent: TypingRhythmAgent;
}

const TypingMonitor: React.FC<TypingMonitorProps> = ({
  isMonitoring,
  onAnomalyDetected,
  typingAgent,
}) => {
  const [inputText, setInputText] = useState('');
  const keyDownTimes = useRef<Map<string, number>>(new Map());
  const lastKeyTime = useRef<number>(0);

  const handleTextChange = (text: string) => {
    if (!isMonitoring) {
      setInputText(text);
      return;
    }

    const timestamp = Date.now();
    
    // Detect if text was added or removed
    if (text.length > inputText.length) {
      // Key was pressed (text added)
      const newChar = text[text.length - 1];
      keyDownTimes.current.set(newChar, timestamp);
      
      // Simulate key down event
      const result = typingAgent.analyzeKeystroke(newChar, true, timestamp);
      if (result.score > 0.3) {
        onAnomalyDetected(result.score, result.reasons);
      }
      
      // Simulate immediate key up for typing analysis
      setTimeout(() => {
        const keyUpResult = typingAgent.analyzeKeystroke(newChar, false, timestamp + 50);
        if (keyUpResult.score > 0.4) {
          onAnomalyDetected(keyUpResult.score, keyUpResult.reasons);
        }
      }, 50);
      
    } else if (text.length < inputText.length) {
      // Key was deleted (backspace)
      const result = typingAgent.analyzeKeystroke('Backspace', true, timestamp);
      if (result.score > 0.3) {
        onAnomalyDetected(result.score, result.reasons);
      }
      
      setTimeout(() => {
        const keyUpResult = typingAgent.analyzeKeystroke('Backspace', false, timestamp + 30);
        if (keyUpResult.score > 0.4) {
          onAnomalyDetected(keyUpResult.score, keyUpResult.reasons);
        }
      }, 30);
    }
    
    setInputText(text);
    lastKeyTime.current = timestamp;
  };

  const simulateRobotTyping = () => {
    // Simulate very regular typing pattern (bot-like behavior)
    const robotText = "This is automated typing with perfect timing";
    setInputText('');
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < robotText.length) {
        const char = robotText[index];
        const timestamp = Date.now();
        
        // Very consistent timing (suspicious)
        const result = typingAgent.analyzeKeystroke(char, false, timestamp);
        if (result.score > 0.3) {
          onAnomalyDetected(result.score, result.reasons);
        }
        
        setInputText(robotText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100); // Perfectly consistent 100ms intervals (very suspicious)
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Type here to test keystroke analysis:</Text>
      <TextInput
        style={styles.textInput}
        value={inputText}
        onChangeText={handleTextChange}
        placeholder="Start typing to analyze keystroke patterns..."
        multiline
        editable={isMonitoring}
      />
      {isMonitoring && (
        <Text style={styles.instruction}>
          Try typing normally, then try typing very fast or very slow to see anomaly detection
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#ffffff',
    margin: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
  },
  instruction: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default TypingMonitor;
