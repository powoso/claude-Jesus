import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.powoso.dailywalk',
  appName: 'Daily Walk',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Daily Walk',
  },
};

export default config;
