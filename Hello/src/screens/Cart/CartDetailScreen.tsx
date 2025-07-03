/**
 * 购物车详情屏幕
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { CartStackParamList } from '../../navigation/types';

// 定义组件属性类型
type CartDetailScreenProps = StackScreenProps<CartStackParamList, 'CartDetail'>;

/**
 * 商品详情类型
 */
interface ProductDetail {
  id: string;
  title: string;
  price: string;
  description: string;
  inventory: number;
  specs: Array<{
    name: string;
    options: string[];
  }>;
  selectedSpecs: Record<string, string>;
}

/**
 * 购物车详情屏幕组件
 */
const CartDetailScreen: React.FC<CartDetailScreenProps> = ({ route, navigation }) => {
  // 获取路由参数
  const { id } = route.params;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // 模拟数据加载
  useEffect(() => {
    // 模拟网络请求
    const timer = setTimeout(() => {
      setProduct({
        id,
        title: `购物车商品 ${id}`,
        price: '¥199.00',
        description: '这是一个来自购物车的商品详情，您可以在这里查看详细信息并进行操作。',
        inventory: 50,
        specs: [
          {
            name: '颜色',
            options: ['红色', '蓝色', '黑色', '白色'],
          },
          {
            name: '尺寸',
            options: ['S', 'M', 'L', 'XL', 'XXL'],
          },
        ],
        selectedSpecs: {
          '颜色': '红色',
          '尺寸': 'M',
        },
      });
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [id]);

  // 更新数量
  const updateQuantity = (change: number) => {
    if (!product) return;
    const newQuantity = Math.max(1, Math.min(product.inventory, quantity + change));
    setQuantity(newQuantity);
  };

  // 更新规格选择
  const updateSelectedSpec = (specName: string, value: string) => {
    if (!product) return;
    setProduct({
      ...product,
      selectedSpecs: {
        ...product.selectedSpecs,
        [specName]: value,
      },
    });
  };

  // 添加到购物车
  const addToCart = () => {
    if (!product) return;
    
    const specsText = Object.entries(product.selectedSpecs)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    Alert.alert(
      '已添加到购物车',
      `商品：${product.title}\n数量：${quantity}\n规格：${specsText}`,
      [
        { text: '继续购物', style: 'cancel' },
        { 
          text: '去购物车', 
          onPress: () => navigation.goBack()
        },
      ]
    );
  };

  // 立即购买
  const buyNow = () => {
    if (!product) return;
    
    Alert.alert(
      '订单提示',
      '是否确认下单？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确认', 
          onPress: () => Alert.alert('下单成功', '订单已提交，请等待处理')
        },
      ]
    );
  };

  // 加载状态
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>加载中...</Text>
      </View>
    );
  }

  // 数据为空
  if (!product) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>未找到商品信息</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 商品图片占位 */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>商品图片 - {product.title}</Text>
        </View>

        {/* 商品基本信息 */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>{product.price}</Text>
          <Text style={styles.inventory}>库存: {product.inventory}件</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* 商品规格 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>商品规格</Text>
          
          {product.specs.map((spec) => (
            <View key={spec.name} style={styles.specContainer}>
              <Text style={styles.specName}>{spec.name}</Text>
              <View style={styles.specOptions}>
                {spec.options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.specOption,
                      product.selectedSpecs[spec.name] === option && styles.specOptionSelected,
                    ]}
                    onPress={() => updateSelectedSpec(spec.name, option)}
                  >
                    <Text
                      style={[
                        styles.specOptionText,
                        product.selectedSpecs[spec.name] === option && styles.specOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* 数量选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>购买数量</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(-1)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 底部安全区域 */}
        <View style={styles.safeArea} />
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.addToCartButton]}
          onPress={addToCart}
        >
          <Text style={styles.addToCartButtonText}>加入购物车</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buyNowButton]}
          onPress={buyNow}
        >
          <Text style={styles.buyNowButtonText}>立即购买</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imagePlaceholder: {
    height: 300,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#999',
    fontSize: 16,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f50',
    marginBottom: 8,
  },
  inventory: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f50',
    paddingLeft: 8,
  },
  specContainer: {
    marginBottom: 16,
  },
  specName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  specOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  specOptionSelected: {
    backgroundColor: '#fff0f0',
    borderColor: '#f50',
  },
  specOptionText: {
    fontSize: 14,
    color: '#333',
  },
  specOptionTextSelected: {
    color: '#f50',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quantityButtonText: {
    fontSize: 16,
    color: '#333',
  },
  quantity: {
    marginHorizontal: 16,
    fontSize: 16,
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButton: {
    backgroundColor: '#fff5f0',
    borderWidth: 1,
    borderColor: '#f50',
    marginRight: 8,
  },
  addToCartButtonText: {
    color: '#f50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buyNowButton: {
    backgroundColor: '#f50',
  },
  buyNowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  safeArea: {
    height: 60,
  },
});

export default CartDetailScreen; 