/**
 * 商家导航
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import { MerchantTabParamList, MerchantChatStackParamList } from './types';

// 导入商家屏幕
import MerchantHomeScreen from '../screens/Merchant/MerchantHomeScreen';
import MerchantProductsScreen from '../screens/Merchant/MerchantProductsScreen';
import MerchantOrdersScreen from '../screens/Merchant/MerchantOrdersScreen';

// 导入商家聊天屏幕
import MerchantChatScreen from '../screens/MerchantChat/MerchantChatScreen';
import MerchantChatDetailScreen from '../screens/MerchantChat/MerchantChatDetailScreen';

// 导入商家个人中心屏幕
import MerchantProfileScreen from '../screens/Merchant/MerchantProfileScreen';

// 创建底部标签导航
const Tab = createBottomTabNavigator<MerchantTabParamList>();

// 创建商家聊天导航器
const ChatStack = createStackNavigator<MerchantChatStackParamList>();

// 商家聊天导航器
const MerchantChatNavigator = () => {
  return (
    <ChatStack.Navigator>
      <ChatStack.Screen
        name="MerchantChatList"
        component={MerchantChatScreen}
        options={{
          title: '客户消息',
          headerStyle: {
            backgroundColor: '#fff',
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0',
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />
      <ChatStack.Screen
        name="MerchantChatDetail"
        component={MerchantChatDetailScreen}
        options={({ route }) => ({ 
          title: route.params.userName || '聊天详情',
          headerStyle: {
            backgroundColor: '#fff',
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#f0f0f0',
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        })}
      />
    </ChatStack.Navigator>
  );
};

// 图标Unicode映射
const ICONS = {
  MerchantHome: {
    active: '🏪', 
    inactive: '🏪'
  },
  MerchantProducts: {
    active: '📦', 
    inactive: '📦'
  },
  MerchantOrders: {
    active: '📋', 
    inactive: '📋'
  },
  MerchantChat: {
    active: '💬', 
    inactive: '💬'
  },
  MerchantProfile: {
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
  const iconSet = ICONS[route.name as keyof typeof ICONS] || ICONS.MerchantHome;
  const icon = focused ? iconSet.active : iconSet.inactive;
  
  return <Text style={{ color, fontSize: 24 }}>{icon}</Text>;
};

/**
 * 商家标签导航器
 */
const MerchantTabNavigator = () => {
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
        name="MerchantHome" 
        component={MerchantHomeScreen} 
        options={{ 
          title: '店铺',
          tabBarLabel: '店铺',
        }}
      />
      <Tab.Screen 
        name="MerchantProducts" 
        component={MerchantProductsScreen} 
        options={{ 
          title: '商品',
          tabBarLabel: '商品',
        }}
      />
      <Tab.Screen 
        name="MerchantOrders" 
        component={MerchantOrdersScreen} 
        options={{ 
          title: '订单',
          tabBarLabel: '订单',
        }}
      />
      <Tab.Screen 
        name="MerchantChat" 
        component={MerchantChatNavigator} 
        options={{ 
          title: '消息',
          tabBarLabel: '消息',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="MerchantProfile" 
        component={MerchantProfileScreen} 
        options={{ 
          title: '我的',
          tabBarLabel: '我的',
        }}
      />
    </Tab.Navigator>
  );
};

export default MerchantTabNavigator; 