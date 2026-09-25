import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.beetre.BeerCounter',
  appName: 'ビア＋＋',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: KeyboardResize.None,
      resizeOnFullScreen: false
    },
    CapacitorHttp: {
      enabled: true,
    },
    // 開発時も含めて完全にCapacitorのブリッジログを消したい場合：
    //  loggingBehavior: 'none'   
  }
};
export default config;
