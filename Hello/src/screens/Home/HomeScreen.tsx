/**
 * 首页主屏幕
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/types';

// 定义组件属性类型
type HomeScreenProps = StackScreenProps<HomeStackParamList, 'HomeScreen'>;

/**
 * 首页主屏幕组件
 */
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  // 模拟首页数据
  const homeItems = [
    { id: '1', title: '热门商品' },
    { id: '2', title: '新品上架' },
    { id: '3', title: '限时特惠' },
    { id: '4', title: '热门活动' },
  ];

  // 跳转到详情页
  const navigateToDetail = (id: string, title: string) => {
    navigation.navigate('HomeDetail', { id, title });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>发现好物</Text>
        <Text style={styles.headerSubtitle}>每日好物推荐</Text>
      </View>

      <View style={styles.content}>
        {homeItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigateToDetail(item.id, item.title)}
          >
            <View style={styles.cardImagePlaceholder}>
              <Text style={styles.cardImageText}>商品图片</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>这是一段商品描述文本，介绍商品的特点和优势</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardPrice}>¥99.00</Text>
                <Text style={styles.cardTag}>热卖</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImagePlaceholder: {
    height: 120,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageText: {
    color: '#999',
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f50',
  },
  cardTag: {
    fontSize: 12,
    color: '#f50',
    borderWidth: 1,
    borderColor: '#f50',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});

export default HomeScreen; 