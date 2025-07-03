/**
 * React Native应用入口
 */
import React, { useEffect } from 'react';
import { StatusBar, useColorScheme, LogBox, Text } from 'react-native'; // 导入状态栏和颜色模式
import { SafeAreaProvider } from 'react-native-safe-area-context'; // 导入安全区域提供者
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from './src/navigation'; // 导入导航组件

// 忽略特定的黄色警告
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Non-serializable values were found in the navigation state',
]);

/**
 * 应用根组件
 */ 
function App() {
  const isDarkMode = useColorScheme() === 'dark'; // 获取颜色模式

  useEffect(() => {
    // 应用初始化逻辑
    console.log('App initialized');
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer fallback={<Text>Loading...</Text>}>
          <Navigation />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
