/**
 * 视频模块导航
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { VideoStackParamList } from './types';

// 导入视频模块的屏幕组件
import VideoScreen from '../screens/Video/VideoScreen';
import VideoDetailScreen from '../screens/Video/VideoDetailScreen';

// 创建堆栈导航器
const Stack = createStackNavigator<VideoStackParamList>();

/**
 * 视频模块导航组件
 */
const VideoNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="VideoScreen"
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
        name="VideoScreen"
        component={VideoScreen}
        options={{ title: '视频' }}
      />
      <Stack.Screen
        name="VideoDetail"
        component={VideoDetailScreen}
        options={{ title: '视频播放', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default VideoNavigator; 