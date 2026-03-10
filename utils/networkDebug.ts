// utils/networkDebug.ts
import { Platform } from 'react-native';
import * as Network from 'expo-network';

export const debugNetwork = async () => {
  console.log('🔍 ===== NETWORK DEBUG INFO =====');
  console.log('📱 Platform:', Platform.OS);
  console.log('📱 Platform Version:', Platform.Version);
  
  try {
    // Check network state
    const networkState = await Network.getNetworkStateAsync();
    console.log('📡 Network State:', {
      isConnected: networkState.isConnected,
      isInternetReachable: networkState.isInternetReachable,
      type: networkState.type
    });

    // Get IP address
    const ipAddress = await Network.getIpAddressAsync();
    console.log('🌐 IP Address:', ipAddress);
    
  } catch (error) {
    console.log('❌ Network check failed:', error);
  }

  // Test Firebase Auth domain
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  console.log('🔥 Firebase Auth Domain:', authDomain);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`https://${authDomain}`, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('✅ Firebase Auth domain reachable:', response.status);
  } catch (error) {
    console.log('❌ Firebase Auth domain not reachable:', error);
  }

  // Test general internet
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('✅ Internet reachable:', response.status);
  } catch (error) {
    console.log('❌ Internet not reachable:', error);
  }

  console.log('🔍 ===== END NETWORK DEBUG =====');
};