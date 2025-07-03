/**
 * 首页模块导航
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeStackParamList } from './types';

// 导入首页模块的屏幕组件
import HomeScreen from '../screens/Home/HomeScreen';
import HomeDetailScreen from '../screens/Home/HomeDetailScreen';

// 创建堆栈导航器
const Stack = createStackNavigator<HomeStackParamList>();

/**
 * 首页模块导航组件
 */
const HomeNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerTintColor: '#333',
        headerStyle: {
          backgroundColor: '#fff',
        },
      }}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: '首页' }}
      />
      <Stack.Screen
        name="HomeDetail"
        component={HomeDetailScreen}
        options={({ route }) => ({ title: route.params.title || '详情' })}
      />
    </Stack.Navigator>
  );
};

export default HomeNavigator; 