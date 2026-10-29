import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';
import App from './App';

// Web ortamında React Navigation'ın saf View katmanıyla kusursuz çalışması için
enableScreens(false);

AppRegistry.registerComponent('CryptoAI', () => App);
AppRegistry.runApplication('CryptoAI', {
  rootTag: document.getElementById('root'),
});
