/**
 * 身份验证导航
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// 导入身份验证相关页面
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';

// 导入类型
import { AuthStackParamList } from './types';

// 创建身份验证堆栈导航器
const AuthStack = createStackNavigator<AuthStackParamList>();

/**
 * 身份验证导航组件
 * @returns {JSX.Element} - 身份验证导航
 */
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f5f5f5' }
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      {/* 登录成功后跳转到Home */}
      <AuthStack.Screen name="Home" component={() => null} options={{ headerShown: false }} />
    </AuthStack.Navigator>
  );
};

export default AuthNavigator; 