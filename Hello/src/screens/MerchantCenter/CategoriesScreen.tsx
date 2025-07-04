/**
 * 商家经营类目管理页面
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MerchantCenterStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';

// 类目类型定义
type Category = {
  id: string;
  name: string;
  parentId: string | null;
  selected: boolean;
  level: number;
  children?: Category[];
};

// 定义组件属性类型
type CategoriesScreenProps = StackScreenProps<MerchantCenterStackParamList, 'Categories'>;

/**
 * 商家经营类目管理页面组件
 */
const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 设置页面标题
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: '经营类目',
      headerRight: () => (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, saving]);

  // 加载分类数据
  useEffect(() => {
    loadCategories();
  }, []);

  /**
   * 加载类目数据
   */
  const loadCategories = async () => {
    setLoading(true);
    try {
      // 假数据，实际应该从API获取
      const data = getMockCategories();
      setCategories(data);

      // 假设已选择的类目
      setSelectedCategories(['1', '1-1', '2-3']);
      
      // 更新已选状态
      const updatedCategories = updateSelectedStatus(data, ['1', '1-1', '2-3']);
      setCategories(updatedCategories);
    } catch (error) {
      console.error('加载类目失败:', error);
      Alert.alert('加载失败', '无法加载经营类目，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取模拟类目数据
   */
  const getMockCategories = (): Category[] => {
    return [
      {
        id: '1',
        name: '服装',
        parentId: null,
        selected: false,
        level: 1,
        children: [
          {
            id: '1-1',
            name: '男装',
            parentId: '1',
            selected: false,
            level: 2,
            children: [
              {
                id: '1-1-1',
                name: '衬衫',
                parentId: '1-1',
                selected: false,
                level: 3
              },
              {
                id: '1-1-2',
                name: '裤子',
                parentId: '1-1',
                selected: false,
                level: 3
              }
            ]
          },
          {
            id: '1-2',
            name: '女装',
            parentId: '1',
            selected: false,
            level: 2,
            children: [
              {
                id: '1-2-1',
                name: '连衣裙',
                parentId: '1-2',
                selected: false,
                level: 3
              },
              {
                id: '1-2-2',
                name: '上衣',
                parentId: '1-2',
                selected: false,
                level: 3
              }
            ]
          }
        ]
      },
      {
        id: '2',
        name: '电子产品',
        parentId: null,
        selected: false,
        level: 1,
        children: [
          {
            id: '2-1',
            name: '手机',
            parentId: '2',
            selected: false,
            level: 2
          },
          {
            id: '2-2',
            name: '电脑',
            parentId: '2',
            selected: false,
            level: 2
          },
          {
            id: '2-3',
            name: '配件',
            parentId: '2',
            selected: false,
            level: 2,
            children: [
              {
                id: '2-3-1',
                name: '耳机',
                parentId: '2-3',
                selected: false,
                level: 3
              },
              {
                id: '2-3-2',
                name: '充电器',
                parentId: '2-3',
                selected: false,
                level: 3
              }
            ]
          }
        ]
      },
      {
        id: '3',
        name: '食品',
        parentId: null,
        selected: false,
        level: 1,
        children: [
          {
            id: '3-1',
            name: '零食',
            parentId: '3',
            selected: false,
            level: 2
          },
          {
            id: '3-2',
            name: '饮料',
            parentId: '3',
            selected: false,
            level: 2
          }
        ]
      }
    ];
  };

  /**
   * 更新类目选择状态
   */
  const updateSelectedStatus = (data: Category[], selectedIds: string[]): Category[] => {
    const updateCategory = (category: Category): Category => {
      const newCategory = {
        ...category,
        selected: selectedIds.includes(category.id)
      };

      if (category.children) {
        newCategory.children = category.children.map(child => updateCategory(child));
      }

      return newCategory;
    };

    return data.map(category => updateCategory(category));
  };

  /**
   * 处理类目选择
   */
  const handleCategorySelect = (category: Category) => {
    let newSelectedCategories = [...selectedCategories];
    
    if (selectedCategories.includes(category.id)) {
      // 取消选择
      newSelectedCategories = newSelectedCategories.filter(id => id !== category.id);
      
      // 同时取消子类目
      if (category.children) {
        const removeChildIds = (children: Category[]) => {
          children.forEach(child => {
            newSelectedCategories = newSelectedCategories.filter(id => id !== child.id);
            if (child.children) {
              removeChildIds(child.children);
            }
          });
        };
        
        if (category.children) {
          removeChildIds(category.children);
        }
      }
    } else {
      // 添加选择
      newSelectedCategories.push(category.id);
    }
    
    setSelectedCategories(newSelectedCategories);
    
    // 更新类目选择状态
    const updatedCategories = updateSelectedStatus(categories, newSelectedCategories);
    setCategories(updatedCategories);
  };

  /**
   * 过滤搜索结果
   */
  const filterCategories = (data: Category[], query: string): Category[] => {
    if (!query) return data;
    
    const searchLower = query.toLowerCase();
    
    const filterCategory = (category: Category): Category | null => {
      const matchesSearch = category.name.toLowerCase().includes(searchLower);
      
      let filteredChildren: (Category | null)[] = [];
      if (category.children) {
        filteredChildren = category.children.map(child => filterCategory(child)).filter(Boolean) as Category[];
      }
      
      // 如果当前类目匹配或者有子类目匹配，则保留
      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...category,
          children: filteredChildren.length > 0 ? filteredChildren as Category[] : category.children
        };
      }
      
      return null;
    };
    
    const filteredData = data.map(category => filterCategory(category)).filter(Boolean) as Category[];
    return filteredData;
  };

  /**
   * 处理保存
   */
  const handleSave = async () => {
    setSaving(true);
    
    try {
      // 实际应该调用API保存
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('保存成功', '经营类目已更新', [
        { text: '确定', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('保存类目失败:', error);
      Alert.alert('保存失败', '更新经营类目失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  /**
   * 渲染类目项
   */
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <View>
      <TouchableOpacity
        style={[
          styles.categoryItem,
          { paddingLeft: 15 + (item.level - 1) * 20 },
          item.selected && styles.selectedItem
        ]}
        onPress={() => handleCategorySelect(item)}
      >
        <Text style={[styles.categoryName, item.selected && styles.selectedText]}>
          {item.name}
        </Text>
        <View style={styles.checkbox}>
          {item.selected && <View style={styles.checkboxInner} />}
        </View>
      </TouchableOpacity>
      
      {item.children && item.children.map(child => (
        <View key={child.id}>
          <TouchableOpacity
            style={[
              styles.categoryItem,
              { paddingLeft: 15 + child.level * 20 },
              child.selected && styles.selectedItem
            ]}
            onPress={() => handleCategorySelect(child)}
          >
            <Text style={[styles.categoryName, child.selected && styles.selectedText]}>
              {child.name}
            </Text>
            <View style={styles.checkbox}>
              {child.selected && <View style={styles.checkboxInner} />}
            </View>
          </TouchableOpacity>
          
          {child.children && child.children.map(grandchild => (
            <TouchableOpacity
              key={grandchild.id}
              style={[
                styles.categoryItem,
                { paddingLeft: 15 + grandchild.level * 20 },
                grandchild.selected && styles.selectedItem
              ]}
              onPress={() => handleCategorySelect(grandchild)}
            >
              <Text style={[styles.categoryName, grandchild.selected && styles.selectedText]}>
                {grandchild.name}
              </Text>
              <View style={styles.checkbox}>
                {grandchild.selected && <View style={styles.checkboxInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  /**
   * 渲染加载状态
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1677ff" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  const filteredCategories = filterCategories(categories, searchQuery);

  return (
    <View style={styles.container}>
      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索类目"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>
      
      {/* 选择提示 */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          已选择 {selectedCategories.length} 个类目
        </Text>
      </View>
      
      {/* 类目列表 */}
      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? '没有找到相关类目' : '暂无可选类目'}
            </Text>
          </View>
        }
      />
      
      {/* 底部按钮 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>保存选择</Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 15,
  },
  infoContainer: {
    padding: 10,
    backgroundColor: '#E6F7FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoText: {
    color: '#1677ff',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 80,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingRight: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  selectedItem: {
    backgroundColor: '#f0f7ff',
  },
  categoryName: {
    fontSize: 15,
    color: '#333',
  },
  selectedText: {
    color: '#1677ff',
    fontWeight: '500',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1677ff',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#1677ff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#97c2ff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 15,
  },
  saveButtonText: {
    color: '#1677ff',
    fontSize: 16,
  },
});

export default CategoriesScreen; 