/**
 * 导航入口文件
 */
import React from 'react';
import AppNavigator from './AppNavigator';
import { AuthProvider } from '../contexts/AuthContext';

/**
 * 根导航组件
 */
const Navigation: React.FC = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default Navigation; 