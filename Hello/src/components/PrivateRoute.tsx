/**
 * 私有路由组件
 * 用于基于角色的路由访问控制
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// 定义类型
interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoles?: string | string[];
  fallback?: React.ReactNode;
}

/**
 * 私有路由组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @param {string|Array} props.requiredRoles - 所需角色
 * @param {React.ReactNode} props.fallback - 无权限时显示的组件
 * @returns {JSX.Element} - 渲染的组件
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRoles, fallback }) => {
  // 获取认证上下文
  const { isAuthenticated, loading, hasPermission } = useAuth();

  // 加载中
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1677ff" />
        <Text style={styles.text}>加载中...</Text>
      </View>
    );
  }

  // 未登录或无权限
  if (!isAuthenticated || !hasPermission(requiredRoles)) {
    // 如果提供了自定义的fallback组件，则使用它
    if (fallback) {
      return fallback as React.ReactElement;
    }

    // 默认的无权限提示
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {!isAuthenticated ? '请先登录' : '您没有权限访问此页面'}
        </Text>
      </View>
    );
  }

  // 有权限，渲染子组件
  return children as React.ReactElement;
};

// 样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4d4f',
    textAlign: 'center',
  },
});

export default PrivateRoute; 