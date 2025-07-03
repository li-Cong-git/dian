/**
 * 购物车主屏幕
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { CartStackParamList } from '../../navigation/types';

// 定义组件属性类型
type CartScreenProps = StackScreenProps<CartStackParamList, 'CartScreen'>;

// 购物车商品类型
interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

/**
 * 购物车主屏幕组件
 */
const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  // 购物车商品数据（模拟）
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: '1', title: '商品 1', price: 99, quantity: 1 },
    { id: '2', title: '商品 2', price: 199, quantity: 2 },
    { id: '3', title: '商品 3', price: 59, quantity: 1 },
  ]);

  // 计算总价
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // 是否全选
  const [allSelected, setAllSelected] = useState(true);
  
  // 选中的商品 ID
  const [selectedIds, setSelectedIds] = useState<string[]>(cartItems.map(item => item.id));

  // 跳转到商品详情
  const navigateToDetail = (id: string) => {
    navigation.navigate('CartDetail', { id });
  };

  // 更改商品数量
  const updateQuantity = (id: string, change: number) => {
    setCartItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, quantity: Math.max(1, item.quantity + change) } 
          : item
      )
    );
  };

  // 移除商品
  const removeItem = (id: string) => {
    Alert.alert(
      '确认删除',
      '您确定要从购物车中删除此商品吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          onPress: () => {
            setCartItems(prev => prev.filter(item => item.id !== id));
            setSelectedIds(prev => prev.filter(itemId => itemId !== id));
          } 
        },
      ]
    );
  };

  // 选择/取消选择商品
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        const newIds = prev.filter(itemId => itemId !== id);
        setAllSelected(false);
        return newIds;
      } else {
        const newIds = [...prev, id];
        if (newIds.length === cartItems.length) {
          setAllSelected(true);
        }
        return newIds;
      }
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      setAllSelected(false);
    } else {
      setSelectedIds(cartItems.map(item => item.id));
      setAllSelected(true);
    }
  };

  // 结算
  const checkout = () => {
    if (selectedIds.length === 0) {
      Alert.alert('提示', '请先选择要结算的商品');
      return;
    }
    Alert.alert('结算', `已选择 ${selectedIds.length} 件商品，总价：¥${totalPrice.toFixed(2)}`);
  };

  // 渲染购物车商品项
  const renderCartItem = ({ item }: { item: CartItem }) => {
    const isSelected = selectedIds.includes(item.id);
    
    return (
      <View style={styles.cartItem}>
        {/* 选择框 */}
        <TouchableOpacity 
          style={styles.checkbox} 
          onPress={() => toggleSelect(item.id)}
        >
          <View style={[styles.checkboxInner, isSelected && styles.checkboxSelected]} />
        </TouchableOpacity>
        
        {/* 商品图片占位 */}
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => navigateToDetail(item.id)}
        >
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageText}>图片</Text>
          </View>
        </TouchableOpacity>
        
        {/* 商品信息 */}
        <View style={styles.itemDetails}>
          <Text 
            style={styles.itemTitle}
            numberOfLines={1}
            onPress={() => navigateToDetail(item.id)}
          >
            {item.title}
          </Text>
          <Text style={styles.itemPrice}>¥{item.price.toFixed(2)}</Text>
          
          {/* 数量控制 */}
          <View style={styles.quantityControl}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, -1)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 删除按钮 */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => removeItem(item.id)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 渲染空购物车
  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>购物车还是空的</Text>
      <TouchableOpacity style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>去逛逛</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 商品列表 */}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyCart}
        style={styles.list}
      />
      
      {/* 底部结算栏 */}
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          {/* 全选 */}
          <TouchableOpacity 
            style={styles.selectAllContainer}
            onPress={toggleSelectAll}
          >
            <View style={[styles.checkbox, styles.selectAllCheckbox]}>
              <View style={[styles.checkboxInner, allSelected && styles.checkboxSelected]} />
            </View>
            <Text style={styles.selectAllText}>全选</Text>
          </TouchableOpacity>
          
          {/* 合计 */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>合计：</Text>
            <Text style={styles.totalPrice}>¥{totalPrice.toFixed(2)}</Text>
          </View>
          
          {/* 结算按钮 */}
          <TouchableOpacity 
            style={styles.checkoutButton}
            onPress={checkout}
          >
            <Text style={styles.checkoutButtonText}>
              结算({selectedIds.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#f50',
  },
  imageContainer: {
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  imageText: {
    color: '#999',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
    height: 80,
  },
  itemTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f50',
    marginBottom: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 24,
    height: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 14,
    color: '#333',
  },
  quantity: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllCheckbox: {
    marginRight: 4,
  },
  selectAllText: {
    fontSize: 14,
    color: '#333',
  },
  totalContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginRight: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#333',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f50',
  },
  checkoutButton: {
    backgroundColor: '#f50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#f50',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CartScreen; 