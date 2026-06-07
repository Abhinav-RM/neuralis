import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neuralis.app',
  appName: 'NEURALIS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'icon',
      iconColor: '#4F46E5'
    }
  }
};

export default config;
