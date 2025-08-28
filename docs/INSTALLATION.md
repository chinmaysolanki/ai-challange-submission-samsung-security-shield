# 🚀 Samsung Security Shield - Installation Guide

## Complete Setup Instructions for Samsung EnnovanteX 2025 Competition Entry

---

## 📋 **Prerequisites**

### **System Requirements**
- **Operating System**: macOS 10.15+, Windows 10+, or Ubuntu 18.04+
- **Node.js**: Version 18.0+ (LTS recommended)
- **npm**: Version 8.0+ (comes with Node.js)
- **Memory**: Minimum 8GB RAM (16GB recommended)
- **Storage**: 5GB free space for development environment

### **Mobile Development Environment**

#### **For Android Development:**
- **Android Studio**: Latest version with SDK 21+ (Android 5.0+)
- **Java Development Kit**: JDK 11 or newer
- **Android SDK**: API levels 21-34
- **Android Virtual Device**: Pixel 7 Pro or similar (for testing)

#### **For iOS Development (macOS only):**
- **Xcode**: Version 14.0+ from Mac App Store
- **iOS Simulator**: iOS 12.0+ support
- **CocoaPods**: Latest version (`sudo gem install cocoapods`)

---

## 🔧 **Quick Installation (5 Minutes)**

### **Step 1: Clone the Repository**
```bash
# Clone from GitHub
git clone https://github.com/chinmaysolanki/samsung-security-shield-2025.git
cd samsung-security-shield-2025
```

### **Step 2: Install Dependencies**
```bash
# Install Node.js dependencies
npm install

# For iOS (macOS only)
cd ios && pod install && cd ..
```

### **Step 3: Start Development Server**
```bash
# Start Metro bundler
npx react-native start --reset-cache
```

### **Step 4: Run on Device/Emulator**
```bash
# For Android
npx react-native run-android

# For iOS (macOS only)
npx react-native run-ios
```

---

## 🛠️ **Detailed Installation Steps**

### **1. Development Environment Setup**

#### **Install Node.js**
```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x+
```

#### **Install React Native CLI**
```bash
npm install -g @react-native-community/cli
```

#### **Android Setup**
1. Download and install [Android Studio](https://developer.android.com/studio)
2. Open Android Studio → Configure → SDK Manager
3. Install Android SDK levels 21-34
4. Set environment variables:
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### **iOS Setup (macOS only)**
```bash
# Install Xcode from Mac App Store
# Install CocoaPods
sudo gem install cocoapods

# Verify installation
pod --version
```

### **2. Project Setup**

#### **Clone and Initialize**
```bash
# Clone the repository
git clone https://github.com/chinmaysolanki/samsung-security-shield-2025.git
cd samsung-security-shield-2025

# Verify project structure
ls -la
# You should see: README.md, LICENSE, docs/, src/, package.json
```

#### **Install Project Dependencies**
```bash
# Install all npm packages
npm install

# Install additional React Native dependencies
npx react-native-asset

# For iOS, install CocoaPods dependencies
cd ios
pod install
cd ..
```

### **3. Configuration**

#### **Android Configuration**
1. Create Android emulator:
```bash
# List available AVDs
$ANDROID_HOME/emulator/emulator -list-avds

# Create new AVD (if needed)
$ANDROID_HOME/tools/bin/avdmanager create avd -n Pixel_7_Pro -k "system-images;android-33;google_apis;x86_64"
```

2. Start emulator:
```bash
$ANDROID_HOME/emulator/emulator -avd Pixel_7_Pro
```

#### **iOS Configuration**
```bash
# Open iOS Simulator
open -a Simulator

# Select device: Hardware → Device → iOS 16.0 → iPhone 14 Pro
```

---

## 🚀 **Running the Application**

### **Development Mode**

#### **Start Metro Bundler**
```bash
# Terminal 1: Start Metro bundler
npx react-native start --reset-cache
```

#### **Run on Android**
```bash
# Terminal 2: Run Android app
npx react-native run-android

# Or with specific device
npx react-native run-android --deviceId=emulator-5554
```

#### **Run on iOS**
```bash
# Terminal 2: Run iOS app
npx react-native run-ios

# Or with specific simulator
npx react-native run-ios --simulator="iPhone 14 Pro"
```

### **Production Build**

#### **Android APK**
```bash
# Generate signed APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

#### **iOS Build**
```bash
# Build for iOS
npx react-native run-ios --configuration Release
```

---

## 🧪 **Testing the Installation**

### **Verify Core Functionality**
1. **App Launch**: Application starts without errors
2. **Security Dashboard**: Real-time monitoring interface loads
3. **Agent Status**: All 5 agents show "Active" status
4. **Sensor Access**: Touch, accelerometer, and gyroscope data flowing
5. **Fraud Detection**: Test scenarios trigger appropriate alerts

### **Test Commands**
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance

# Check code coverage
npm run test:coverage
```

---

## 🎬 **Demo Mode Setup**

### **Competition Demo Configuration**
```bash
# Enable demo mode with pre-configured scenarios
npm run demo

# This starts the app with:
# - Simulated fraud scenarios
# - Performance metrics display
# - Real-time detection showcase
```

### **Demo Scenarios Available**
1. **Touch Pattern Anomaly**: Simulates bot-like touch behavior
2. **Typing Rhythm Detection**: Shows automated keyboard input detection
3. **Movement Spoofing**: Demonstrates GPS/motion fraud detection
4. **App Usage Monitoring**: Displays suspicious app interaction patterns
5. **Real-Time Aggregation**: Shows multi-agent risk scoring

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Metro Bundler Issues**
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear npm cache
npm cache clean --force

# Clear watchman (if installed)
watchman watch-del-all
```

#### **Android Build Issues**
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Reset Android project
npx react-native run-android --reset-cache
```

#### **iOS Build Issues**
```bash
# Clean iOS build
cd ios
xcodebuild clean
rm -rf build/
pod install
cd ..
```

#### **Dependency Issues**
```bash
# Reset node_modules
rm -rf node_modules
npm install

# For iOS, reset pods
cd ios
rm -rf Pods/
rm Podfile.lock
pod install
cd ..
```

### **Performance Optimization**
```bash
# Enable Hermes (Android)
# Already configured in android/app/build.gradle

# Enable Flipper debugging
npm install --save-dev react-native-flipper

# Memory profiling
npx react-native run-android --variant=release
```

---

## 📊 **Verification Checklist**

### **Installation Success Criteria**
- [ ] Application launches without crashes
- [ ] All 5 security agents initialize successfully
- [ ] Real-time sensor data is being processed
- [ ] Touch pattern analysis is working
- [ ] Typing rhythm detection is functional
- [ ] Movement behavior monitoring is active
- [ ] App usage tracking is operational
- [ ] Anomaly detection engine is aggregating scores
- [ ] Security dashboard displays real-time metrics
- [ ] Demo scenarios execute properly

### **Performance Verification**
- [ ] App startup time < 3 seconds
- [ ] Memory usage < 50MB during normal operation
- [ ] CPU usage < 10% average
- [ ] Battery impact < 5% per hour
- [ ] Response time < 800ms for fraud detection

---

## 🆘 **Support**

### **Getting Help**
- **Documentation**: Check `/docs` folder for detailed guides
- **Issues**: Report problems via GitHub Issues
- **Performance**: Use built-in performance monitoring tools

### **Contact Information**
- **Competition**: Samsung EnnovanteX 2025 AI Challenge
- **Team**: Samsung Security Shield Team
- **Email**: Available in repository contact information

---

**🎉 Congratulations!** Your Samsung Security Shield is now ready for fraud detection testing and competition demonstration!
