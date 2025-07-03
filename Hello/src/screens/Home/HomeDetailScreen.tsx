/**
 * 首页详情屏幕
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/types';

// 定义组件属性类型
type HomeDetailScreenProps = StackScreenProps<HomeStackParamList, 'HomeDetail'>;

/**
 * 模拟商品数据
 */
interface ProductDetail {
  id: string;
  title: string;
  price: string;
  description: string;
  features: string[];
  specifications: Array<{ key: string; value: string }>;
}

/**
 * 首页详情屏幕组件
 */
const HomeDetailScreen: React.FC<HomeDetailScreenProps> = ({ route }) => {
  // 获取路由参数
  const { id, title } = route.params;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 模拟数据加载
  useEffect(() => {
    // 模拟网络请求
    const timer = setTimeout(() => {
      setProduct({
        id,
        title,
        price: '¥129.00',
        description: '这是一个精美的商品，具有优良品质和精美设计，是您不可错过的选择。',
        features: [
          '高品质材料制作',
          '精美时尚的设计',
          '多种颜色可选',
          '轻便耐用',
          '物美价廉',
        ],
        specifications: [
          { key: '品牌', value: '品牌名称' },
          { key: '材质', value: '高级材质' },
          { key: '尺寸', value: '标准尺寸' },
          { key: '重量', value: '0.5kg' },
          { key: '产地', value: '中国' },
        ],
      });
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [id, title]);

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
    <ScrollView style={styles.container}>
      {/* 商品图片占位 */}
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>商品图片 - {product.title}</Text>
      </View>

      {/* 商品基本信息 */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{product.price}</Text>
        <Text style={styles.description}>{product.description}</Text>
      </View>

      {/* 商品特点 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品特点</Text>
        {product.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* 商品规格 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商品规格</Text>
        {product.specifications.map((spec, index) => (
          <View key={index} style={styles.specItem}>
            <Text style={styles.specKey}>{spec.key}</Text>
            <Text style={styles.specValue}>{spec.value}</Text>
          </View>
        ))}
      </View>

      {/* 底部按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.button, styles.addToCartButton]}>
          <Text style={styles.addToCartButtonText}>加入购物车</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buyNowButton]}>
          <Text style={styles.buyNowButtonText}>立即购买</Text>
        </TouchableOpacity>
      </View>

      {/* 底部安全区域 */}
      <View style={styles.safeArea} />
    </ScrollView>
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
  featureItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  bulletPoint: {
    fontSize: 16,
    color: '#f50',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  specItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  specKey: {
    width: 80,
    fontSize: 14,
    color: '#999',
  },
  specValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
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
    height: 30,
  },
});

export default HomeDetailScreen; 