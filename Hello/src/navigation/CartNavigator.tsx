/**
 * 购物车模块导航
 */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CartStackParamList } from './types';

// 导入购物车模块的屏幕组件
import CartScreen from '../screens/Cart/CartScreen';
import CartDetailScreen from '../screens/Cart/CartDetailScreen';

// 创建堆栈导航器
const Stack = createStackNavigator<CartStackParamList>();

/**
 * 购物车模块导航组件
 */
const CartNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="CartScreen"
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
        name="CartScreen"
        component={CartScreen}
        options={{ title: '购物车' }}
      />
      <Stack.Screen
        name="CartDetail"
        component={CartDetailScreen}
        options={{ title: '商品详情' }}
      />
    </Stack.Navigator>
  );
};

export default CartNavigator; 