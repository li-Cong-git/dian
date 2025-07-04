/**
 * 上传视频导航
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { UploadStackParamList } from './types';

// 导入上传相关页面
import UploadScreen from '../screens/Upload/UploadScreen';
import UploadDetailScreen from '../screens/Upload/UploadDetailScreen';

// 创建堆栈导航
const UploadStack = createStackNavigator<UploadStackParamList>();

/**
 * 上传视频导航器
 */
const UploadNavigator = () => {
  return (
    <UploadStack.Navigator
      screenOptions={{
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
        headerTintColor: '#333',
      }}
    >
      <UploadStack.Screen
        name="UploadScreen"
        component={UploadScreen}
        options={{ title: '上传视频' }}
      />
      <UploadStack.Screen
        name="UploadDetail"
        component={UploadDetailScreen}
        options={({ route }) => ({ 
          title: route.params?.id ? '编辑视频' : '上传新视频' 
        })}
      />
    </UploadStack.Navigator>
  );
};

export default UploadNavigator; 