/**
 * 应用主导航
 */
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from './types';
import { createStackNavigator } from '@react-navigation/stack';

// 导入各模块导航器
import HomeNavigator from './HomeNavigator';
import CartNavigator from './CartNavigator';
import MessageNavigator from './MessageNavigator';
import VideoNavigator from './VideoNavigator';
import ProfileNavigator from './ProfileNavigator';

// 导入身份验证导航器
import AuthNavigator from './AuthNavigator';

// 导入权限管理
import { useAuth } from '../contexts/AuthContext';

// 创建底部标签导航
const Tab = createBottomTabNavigator<RootTabParamList>();

// 图标Unicode映射
const ICONS = {
  Home: {
    active: '🏠', 
    inactive: '🏠'
  },
  Cart: {
    active: '🛒', 
    inactive: '🛒'
  },
  Message: {
    active: '💬', 
    inactive: '💬'
  },
  Video: {
    active: '📹', 
    inactive: '📹'
  },
  Profile: {
    active: '👤', 
    inactive: '👤'
  }
};

/**
 * Tab 图标配置
 * @param route 路由对象
 * @param focused 是否选中
 * @param color 颜色
 * @param size 尺寸
 * @returns React元素
 */
const getTabBarIcon = (route: any, focused: boolean, color: string, size: number) => {
  const iconSet = ICONS[route.name as keyof typeof ICONS] || ICONS.Home;
  const icon = focused ? iconSet.active : iconSet.inactive;
  
  return <Text style={{ color, fontSize: 24 }}>{icon}</Text>;
};

// 用户端底部标签导航
const UserTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => getTabBarIcon(route, focused, color, size),
        tabBarActiveTintColor: '#1677ff',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeNavigator} 
        options={{ 
          title: '首页',
          tabBarLabel: '首页',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartNavigator} 
        options={{ 
          title: '购物车',
          tabBarLabel: '购物车',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Message" 
        component={MessageNavigator} 
        options={{ 
          title: '消息',
          tabBarLabel: '消息',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Video" 
        component={VideoNavigator} 
        options={{ 
          title: '视频',
          tabBarLabel: '视频',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator} 
        options={{ 
          title: '我的',
          tabBarLabel: '我的',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

// 创建导航器
const Stack = createStackNavigator();

// 主导航器
const AppNavigator = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        // 未登录状态 - 显示身份验证相关页面
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        // 用户登录状态 - 显示用户端页面
        <Stack.Screen name="UserMain" component={UserTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator; 