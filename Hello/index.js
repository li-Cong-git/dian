/**
 * @format
 */
import 'react-native-gesture-handler'; // 必须在顶部导入
import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// 忽略特定警告
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Non-serializable values were found in the navigation state',
]);

// 注册应用入口点
AppRegistry.registerComponent(appName, () => App);
