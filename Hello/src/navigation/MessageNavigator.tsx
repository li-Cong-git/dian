/**
 * 消息模块导航
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MessageStackParamList } from './types';

// 导入消息模块的屏幕组件
import MessageScreen from '../screens/Message/MessageScreen';
import MessageDetailScreen from '../screens/Message/MessageDetailScreen';

// 创建堆栈导航器
const Stack = createStackNavigator<MessageStackParamList>();

/**
 * 消息模块导航组件
 */
const MessageNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MessageScreen"
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
        name="MessageScreen"
        component={MessageScreen}
        options={{ title: '消息中心' }}
      />
      <Stack.Screen
        name="MessageDetail"
        component={MessageDetailScreen}
        options={({ route }) => ({
          title: route.params.isRead ? '已读消息' : '未读消息',
        })}
      />
    </Stack.Navigator>
  );
};

export default MessageNavigator; 