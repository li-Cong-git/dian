/**
 * 商家商品管理页面
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';

// 模拟商品数据
const MOCK_PRODUCTS = [
  {
    id: '1',
    name: '精品商务休闲西装',
    price: 399.99,
    stock: 50,
    image: 'https://via.placeholder.com/100',
    status: 'on_sale',
  },
  {
    id: '2',
    name: '时尚运动休闲鞋',
    price: 199.00,
    stock: 35,
    image: 'https://via.placeholder.com/100',
    status: 'on_sale',
  },
  {
    id: '3',
    name: '户外防风防水外套',
    price: 299.90,
    stock: 15,
    image: 'https://via.placeholder.com/100',
    status: 'on_sale',
  },
  {
    id: '4',
    name: '简约商务背包',
    price: 159.00,
    stock: 40,
    image: 'https://via.placeholder.com/100',
    status: 'out_of_stock',
  },
  {
    id: '5',
    name: '高质量蓝牙耳机',
    price: 129.00,
    stock: 0,
    image: 'https://via.placeholder.com/100',
    status: 'out_of_stock',
  }
];

// 商品项组件
const ProductItem = ({ product }: { product: any }) => (
  <View style={styles.productItem}>
    <Image source={{ uri: product.image }} style={styles.productImage} />
    <View style={styles.productInfo}>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.productPrice}>¥{product.price.toFixed(2)}</Text>
      <View style={styles.productMeta}>
        <Text style={styles.productStock}>库存: {product.stock}</Text>
        <Text style={[
          styles.productStatus, 
          product.status === 'on_sale' ? styles.statusOnSale : styles.statusOutOfStock
        ]}>
          {product.status === 'on_sale' ? '在售' : '缺货'}
        </Text>
      </View>
    </View>
    <View style={styles.productActions}>
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>编辑</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.deleteButton]}>
        <Text style={styles.deleteButtonText}>下架</Text>
      </TouchableOpacity>
    </View>
  </View>
);

/**
 * 商家商品页面组件
 */
const MerchantProductsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>商品管理</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ 添加商品</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterBar}>
        <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
          <Text style={styles.activeFilterText}>全部</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>在售</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>缺货</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>已下架</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={MOCK_PRODUCTS}
        renderItem={({ item }) => <ProductItem product={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.productList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#1677ff',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    marginRight: 16,
    paddingBottom: 4,
  },
  activeFilter: {
    borderBottomWidth: 2,
    borderBottomColor: '#1677ff',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    fontSize: 14,
    color: '#1677ff',
    fontWeight: '500',
  },
  productList: {
    padding: 8,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4d4f',
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productStock: {
    fontSize: 13,
    color: '#999',
    marginRight: 8,
  },
  productStatus: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusOnSale: {
    backgroundColor: '#e6f7ff',
    color: '#1677ff',
  },
  statusOutOfStock: {
    backgroundColor: '#fff2f0',
    color: '#ff4d4f',
  },
  productActions: {
    justifyContent: 'space-around',
    paddingLeft: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#fff2f0',
  },
  deleteButtonText: {
    color: '#ff4d4f',
  },
});

export default MerchantProductsScreen; 