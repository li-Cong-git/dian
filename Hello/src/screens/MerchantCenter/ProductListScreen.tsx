 /**
 * 商家商品列表页面
 * 展示商家上架的所有商品，提供搜索、筛选和管理功能
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MerchantCenterStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import productService, { Product } from '../../services/product.service';

// 定义组件属性类型
type ProductListScreenProps = StackScreenProps<MerchantCenterStackParamList, 'ProductList'>;

/**
 * 商品状态选项
 */
const STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '在售', value: 'on_sale' },
  { label: '下架', value: 'off_shelf' },
  { label: '售罄', value: 'sold_out' }
];

/**
 * 排序方式选项
 */
const SORT_OPTIONS = [
  { label: '最新发布', value: 'createdAt:desc' },
  { label: '价格升序', value: 'price:asc' },
  { label: '价格降序', value: 'price:desc' },
  { label: '销量优先', value: 'sold:desc' }
];

/**
 * 商家商品列表页面组件
 */
const ProductListScreen: React.FC<ProductListScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  
  // 筛选和排序状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSort, setSelectedSort] = useState<string>('createdAt:desc');
  
  // 控制筛选器展示
  const [showStatusFilter, setShowStatusFilter] = useState<boolean>(false);
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);

  // 设置页面标题
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '我的商品',
      headerRight: () => (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Text style={styles.addButtonText}>+ 添加</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // 初次加载
  useEffect(() => {
    if (user?._id) {
      loadProducts();
    }
  }, [user]);

  /**
   * 加载商品列表
   */
  const loadProducts = async (page: number = 1, isRefreshing: boolean = false) => {
    if (!user?._id) return;
    
    if (isRefreshing) {
      setRefreshing(true);
    } else if (page === 1) {
      setLoading(true);
    }
    
    try {
      // 解析排序参数
      const [sortField, sortOrder] = selectedSort.split(':');
      
      const response = await productService.getMerchantProducts(user._id, {
        page,
        limit: 10,
        status: selectedStatus,
        sort: sortField,
        order: sortOrder
      });
      
      if (response && response.data) {
        if (page === 1) {
          setProducts(response.data.products || []);
        } else {
          setProducts(prevProducts => [...prevProducts, ...(response.data.products || [])]);
        }
        
        setTotalProducts(response.data.total || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('加载商品列表失败:', error);
      Alert.alert('加载失败', '无法加载商品列表，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * 下拉刷新
   */
  const handleRefresh = () => {
    loadProducts(1, true);
  };

  /**
   * 加载更多
   */
  const handleLoadMore = () => {
    if (products.length < totalProducts && !loading) {
      loadProducts(currentPage + 1);
    }
  };

  /**
   * 应用筛选和排序
   */
  const applyFilters = () => {
    loadProducts(1);
  };

  /**
   * 搜索商品
   */
  const handleSearch = () => {
    // 实现搜索功能
    applyFilters();
  };

  /**
   * 处理商品状态变更
   */
  const handleStatusChange = async (product: Product, newStatus: 'on_sale' | 'off_shelf' | 'sold_out') => {
    try {
      await productService.updateProduct(product._id!, { 
        status: newStatus 
      });
      
      // 刷新列表
      loadProducts(1, true);
      
      Alert.alert(
        '操作成功', 
        newStatus === 'on_sale' ? '商品已上架' : 
        newStatus === 'off_shelf' ? '商品已下架' : 
        '商品已设为售罄'
      );
    } catch (error) {
      console.error('更新商品状态失败:', error);
      Alert.alert('操作失败', '无法更新商品状态，请稍后重试');
    }
  };

  /**
   * 处理删除商品
   */
  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      '删除商品',
      `确定要删除商品"${product.name}"吗？此操作不可恢复。`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: async () => {
            try {
              await productService.deleteProduct(product._id!, user!._id);
              
              // 从列表中移除
              setProducts(prevProducts => 
                prevProducts.filter(p => p._id !== product._id)
              );
              
              Alert.alert('删除成功', '商品已成功删除');
            } catch (error) {
              console.error('删除商品失败:', error);
              Alert.alert('删除失败', '无法删除商品，请稍后重试');
            }
          }
        }
      ]
    );
  };

  /**
   * 渲染商品项
   */
  const renderProductItem = ({ item }: { item: Product }) => {
    // 获取主图（适配字符串数组和对象数组两种格式）
    let mainImage = 'https://via.placeholder.com/100';
    if (item.images && item.images.length > 0) {
      if (typeof item.images[0] === 'string') {
        // 处理字符串数组
        mainImage = item.images[0];
      } else if (typeof item.images[0] === 'object' && item.images[0] !== null) {
        // 处理对象数组
        const imgObj = item.images[0] as any;
        mainImage = imgObj.url || mainImage;
        
        // 尝试找到主图
        const mainImg = (item.images as any[]).find(img => img.isMain);
        if (mainImg && mainImg.url) {
          mainImage = mainImg.url;
        }
      }
    } else if (item.thumbnail) {
      // 如果有缩略图，则使用缩略图
      mainImage = item.thumbnail;
    }
      
    return (
      <TouchableOpacity 
        style={styles.productItem}
        onPress={() => navigation.navigate('EditProduct', { productId: item._id })}
      >
        <Image source={{ uri: mainImage }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>¥{item.price.toFixed(2)}</Text>
          <View style={styles.productMeta}>
            <Text style={styles.productStock}>库存: {item.stock}</Text>
            <Text style={styles.productSold}>销量: {item.sold || 0}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={[
              styles.statusBadge, 
              item.status === 'on_sale' ? styles.activeStatus : styles.inactiveStatus
            ]}>
              {item.status === 'on_sale' ? '在售' : item.status === 'sold_out' ? '售罄' : '下架'}
            </Text>
          </View>
        </View>
        <View style={styles.productActions}>
          {item.status === 'on_sale' ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.offlineButton]}
              onPress={() => handleStatusChange(item, 'off_shelf')}
            >
              <Text style={styles.actionButtonText}>下架</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.onlineButton]}
              onPress={() => handleStatusChange(item, 'on_sale')}
            >
              <Text style={styles.actionButtonText}>上架</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => navigation.navigate('EditProduct', { productId: item._id })}
          >
            <Text style={styles.actionButtonText}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteProduct(item)}
          >
            <Text style={styles.actionButtonText}>删除</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * 渲染页脚（加载更多）
   */
  const renderFooter = () => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1677ff" />
        <Text style={styles.footerText}>正在加载更多...</Text>
      </View>
    );
  };

  /**
   * 渲染空列表状态
   */
  const renderEmptyList = () => {
    if (loading && !refreshing) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无商品</Text>
        <Text style={styles.emptySubText}>点击右上角"添加"按钮添加商品</Text>
        <TouchableOpacity 
          style={styles.emptyAddButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Text style={styles.emptyAddButtonText}>添加商品</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索商品名称"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>搜索</Text>
        </TouchableOpacity>
      </View>
      
      {/* 筛选栏 */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={styles.filterItem}
          onPress={() => {
            setShowStatusFilter(!showStatusFilter);
            setShowSortOptions(false);
          }}
        >
          <Text style={styles.filterText}>
            {selectedStatus === '' 
              ? '全部商品' 
              : selectedStatus === 'on_sale'
                ? '在售商品' 
                : selectedStatus === 'off_shelf'
                  ? '已下架商品'
                  : '售罄商品'}
          </Text>
          <Text style={styles.filterArrow}>▼</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterItem}
          onPress={() => {
            setShowSortOptions(!showSortOptions);
            setShowStatusFilter(false);
          }}
        >
          <Text style={styles.filterText}>
            {SORT_OPTIONS.find(option => option.value === selectedSort)?.label || '最新发布'}
          </Text>
          <Text style={styles.filterArrow}>▼</Text>
        </TouchableOpacity>
      </View>
      
      {/* 商品状态筛选下拉框 */}
      {showStatusFilter && (
        <View style={styles.filterDropdown}>
          {STATUS_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterOption,
                selectedStatus === option.value && styles.selectedFilterOption
              ]}
              onPress={() => {
                setSelectedStatus(option.value);
                setShowStatusFilter(false);
                applyFilters();
              }}
            >
              <Text 
                style={[
                  styles.filterOptionText,
                  selectedStatus === option.value && styles.selectedFilterOptionText
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* 排序方式下拉框 */}
      {showSortOptions && (
        <View style={styles.filterDropdown}>
          {SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterOption,
                selectedSort === option.value && styles.selectedFilterOption
              ]}
              onPress={() => {
                setSelectedSort(option.value);
                setShowSortOptions(false);
                applyFilters();
              }}
            >
              <Text 
                style={[
                  styles.filterOptionText,
                  selectedSort === option.value && styles.selectedFilterOptionText
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* 商品列表 */}
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={products.length === 0 && styles.flatlistContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1677ff']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyList}
      />
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 18,
    paddingHorizontal: 15,
    fontSize: 14,
    backgroundColor: '#f5f5f5',
  },
  searchButton: {
    marginLeft: 10,
    paddingHorizontal: 15,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1677ff',
    borderRadius: 18,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  filterBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  filterItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  filterArrow: {
    fontSize: 12,
    color: '#999',
    marginLeft: 5,
  },
  filterDropdown: {
    position: 'absolute',
    top: 98, // searchContainer高度 + filterBar高度
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 1000,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  selectedFilterOption: {
    backgroundColor: '#f0f7ff',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedFilterOptionText: {
    color: '#1677ff',
    fontWeight: '500',
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 10,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4d4f',
    marginBottom: 6,
  },
  productMeta: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  productStock: {
    fontSize: 12,
    color: '#999',
    marginRight: 10,
  },
  productSold: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  activeStatus: {
    backgroundColor: '#e6f7ff',
    color: '#1677ff',
  },
  inactiveStatus: {
    backgroundColor: '#fff2e8',
    color: '#fa8c16',
  },
  productActions: {
    justifyContent: 'space-between',
    paddingLeft: 10,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginVertical: 2,
  },
  onlineButton: {
    backgroundColor: '#e6f7ff',
  },
  offlineButton: {
    backgroundColor: '#fff2e8',
  },
  editButton: {
    backgroundColor: '#f0f7ff',
  },
  deleteButton: {
    backgroundColor: '#fff1f0',
  },
  actionButtonText: {
    fontSize: 12,
    textAlign: 'center',
  },
  footerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    flexDirection: 'row',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
  flatlistContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 20,
  },
  emptyAddButton: {
    backgroundColor: '#1677ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  addButton: {
    paddingHorizontal: 15,
  },
  addButtonText: {
    color: '#1677ff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProductListScreen;