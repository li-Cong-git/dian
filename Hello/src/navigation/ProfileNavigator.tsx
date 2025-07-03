/**
 * 个人中心模块导航
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileStackParamList } from './types';

// 导入个人中心模块的屏幕组件
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ProfileSettingsScreen from '../screens/Profile/ProfileSettingsScreen';
import ProfileEditScreen from '../screens/Profile/ProfileEditScreen';

// 创建堆栈导航器
const Stack = createStackNavigator<ProfileStackParamList>();

/**
 * 个人中心模块导航组件
 */
const ProfileNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="ProfileScreen"
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
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: '个人中心' }}
      />
      <Stack.Screen
        name="ProfileSettings"
        component={ProfileSettingsScreen}
        options={{ title: '设置' }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: '编辑资料' }}
      />
    </Stack.Navigator>
  );
};

export default ProfileNavigator; 