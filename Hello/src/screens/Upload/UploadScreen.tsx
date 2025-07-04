/**
 * 视频上传主界面
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { UploadStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import videoService from '../../services/video.service';
import { API_BASE_URL } from '../../config/env';
import { useFocusEffect } from '@react-navigation/native';

// 视频接口
interface Video {
  _id: string;
  title: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  createdAt: string;
  views: number;
  description?: string;
}

// 定义组件属性类型
interface UploadScreenProps {
  navigation: StackNavigationProp<UploadStackParamList, 'UploadScreen'>;
  route: RouteProp<UploadStackParamList, 'UploadScreen'>;
}

/**
 * 视频上传主界面
 */
const UploadScreen: React.FC<UploadScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalVideos, setTotalVideos] = useState<number>(0);
  
  // 每次页面获得焦点时加载视频列表
  useFocusEffect(
    React.useCallback(() => {
      loadVideos(true);
      return () => {}; // 清理函数
    }, [])
  );
  
  /**
   * 加载视频列表
   */
  const loadVideos = async (reset: boolean = false) => {
    if (!user?._id) {
      return;
    }
    
    try {
      const currentPage = reset ? 1 : page;
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setRefreshing(true);
      }
      
      const response = await videoService.getMerchantVideos({
        page: currentPage,
        limit: 10
      });
      
      if (response && response.data) {
        const newVideos = response.data.map((video: any) => ({
          _id: video._id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl || `${API_BASE_URL}${video.videoUrl}`,
          videoUrl: video.videoUrl,
          createdAt: new Date(video.createdAt).toLocaleDateString(),
          views: video.views || 0,
          description: video.description
        }));
        
        if (reset) {
          setVideos(newVideos);
        } else {
          setVideos(prev => [...prev, ...newVideos]);
        }
        
        if (response.pagination) {
          setTotalVideos(response.pagination.total);
          setHasMore(currentPage < response.pagination.pages);
          if (hasMore) {
            setPage(currentPage + 1);
          }
        }
      }
    } catch (error) {
      console.error('加载视频列表失败:', error);
      Alert.alert('错误', '无法加载视频列表，请稍后重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  /**
   * 处理上传视频点击事件
   */
  const handleUploadVideo = () => {
    navigation.navigate('UploadDetail', {});
  };
  
  /**
   * 处理视频项点击事件
   * @param {string} id - 视频ID
   */
  const handleVideoPress = (id: string) => {
    navigation.navigate('UploadDetail', { id });
  };
  
  /**
   * 处理删除视频
   * @param {string} id - 视频ID
   * @param {string} title - 视频标题
   */
  const handleDeleteVideo = (id: string, title: string) => {
    Alert.alert(
      '删除视频',
      `确定要删除视频"${title}"吗？此操作无法撤销。`,
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await videoService.deleteVideo(id);
              
              // 删除成功后更新列表
              setVideos(videos.filter(video => video._id !== id));
              
              Alert.alert('成功', '视频已删除');
            } catch (error) {
              console.error('删除视频失败:', error);
              Alert.alert('错误', '删除视频失败，请稍后重试');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  /**
   * 搜索视频
   */
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadVideos(true);
      return;
    }
    
    setLoading(true);
    
    try {
      if (searchQuery) {
        // 本地搜索，真实应用中可改为API搜索
        const filteredVideos = videos.filter(video => 
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setVideos(filteredVideos);
      } else {
        loadVideos(true);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      Alert.alert('错误', '搜索视频失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 加载更多视频
   */
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadVideos();
    }
  };
  
  /**
   * 渲染视频列表项
   */
  const renderVideoItem = ({ item }: { item: Video }) => (
    <View style={styles.videoItem}>
      <TouchableOpacity
        style={styles.videoTouchable}
        onPress={() => handleVideoPress(item._id)}
      >
        <Image
          source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/150' }}
          style={styles.videoThumbnail}
        />
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.videoStats}>
            <Text style={styles.videoDate}>{item.createdAt}</Text>
            <Text style={styles.videoViews}>{item.views} 次观看</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteVideo(item._id, item.title)}
      >
        <Text style={styles.deleteButtonText}>删除</Text>
      </TouchableOpacity>
    </View>
  );
  
  /**
   * 渲染列表头部（搜索和上传按钮）
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索视频"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
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
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleUploadVideo}
      >
        <Text style={styles.uploadButtonText}>上传视频</Text>
      </TouchableOpacity>
    </View>
  );
  
  /**
   * 渲染列表底部
   */
  const renderFooter = () => {
    if (!loading) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#1677ff" />
        <Text style={styles.footerText}>加载中...</Text>
      </View>
    );
  };
  
  /**
   * 渲染内容
   */
  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {loading && videos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1677ff" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadVideos(true)}
              colors={['#1677ff']}
              tintColor="#1677ff"
            />
          }
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无上传的视频</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleUploadVideo}
              >
                <Text style={styles.emptyButtonText}>立即上传</Text>
              </TouchableOpacity>
            </View>
          }
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 30,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchButton: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 20,
  },
  searchButtonText: {
    color: '#666',
    fontSize: 14,
  },
  uploadButton: {
    backgroundColor: '#1677ff',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  videoItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  videoTouchable: {
    flex: 1,
    flexDirection: 'row',
  },
  videoThumbnail: {
    width: 120,
    height: 70,
    backgroundColor: '#e0e0e0',
  },
  videoInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoDate: {
    fontSize: 12,
    color: '#999',
  },
  videoViews: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginRight: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#1677ff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default UploadScreen; 