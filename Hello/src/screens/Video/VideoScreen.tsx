/**
 * 视频主屏幕
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { VideoStackParamList } from '../../navigation/types';

// 定义组件属性类型
type VideoScreenProps = StackScreenProps<VideoStackParamList, 'VideoScreen'>;

// 视频类型
interface Video {
  id: string;
  title: string;
  author: string;
  views: number;
  duration: string;
  thumbnail?: string;
  category: string;
  date: string;
  videoUrl: string;
}

// 获取屏幕宽度
const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 36) / COLUMN_COUNT; // 考虑边距

/**
 * 视频主屏幕组件
 */
const VideoScreen: React.FC<VideoScreenProps> = ({ navigation }) => {
  // 视频分类
  const [categories] = useState<string[]>([
    '推荐', '直播', '美食', '游戏', '音乐', '电影', '教育', '旅行'
  ]);
  
  // 当前选中的分类
  const [selectedCategory, setSelectedCategory] = useState('推荐');
  
  // 视频数据（模拟）
  const [videos] = useState<Video[]>([
    {
      id: '1',
      title: '如何制作美味的家常菜',
      author: '美食达人',
      views: 12500,
      duration: '5:30',
      category: '美食',
      date: '2023-06-10',
      videoUrl: 'https://example.com/videos/1',
    },
    {
      id: '2',
      title: '旅行vlog：探索云南的秘境',
      author: '旅行者小明',
      views: 45600,
      duration: '12:15',
      category: '旅行',
      date: '2023-06-08',
      videoUrl: 'https://example.com/videos/2',
    },
    {
      id: '3',
      title: '2023年最热门的手机游戏',
      author: '游戏评测',
      views: 98700,
      duration: '8:45',
      category: '游戏',
      date: '2023-06-05',
      videoUrl: 'https://example.com/videos/3',
    },
    {
      id: '4',
      title: '学习React Native的技巧',
      author: '编程教程',
      views: 56400,
      duration: '15:20',
      category: '教育',
      date: '2023-06-03',
      videoUrl: 'https://example.com/videos/4',
    },
    {
      id: '5',
      title: '流行音乐混音教程',
      author: '音乐制作人',
      views: 34200,
      duration: '10:05',
      category: '音乐',
      date: '2023-06-01',
      videoUrl: 'https://example.com/videos/5',
    },
    {
      id: '6',
      title: '最新电影预告片合集',
      author: '电影爱好者',
      views: 78900,
      duration: '7:30',
      category: '电影',
      date: '2023-05-28',
      videoUrl: 'https://example.com/videos/6',
    },
  ]);

  // 根据选中的分类筛选视频
  const filteredVideos = selectedCategory === '推荐' 
    ? videos 
    : videos.filter(video => video.category === selectedCategory);

  // 跳转到视频详情
  const navigateToDetail = (video: Video) => {
    navigation.navigate('VideoDetail', { id: video.id, videoUrl: video.videoUrl });
  };

  // 格式化观看次数
  const formatViews = (views: number): string => {
    if (views >= 10000) {
      return `${(views / 10000).toFixed(1)}万次观看`;
    }
    return `${views}次观看`;
  };

  // 渲染分类项
  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.categoryItemSelected,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.categoryTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  // 渲染视频项
  const renderVideoItem = ({ item }: { item: Video }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => navigateToDetail(item)}
    >
      {/* 视频缩略图 */}
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailText}>视频缩略图</Text>
        <View style={styles.duration}>
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
      </View>
      
      {/* 视频信息 */}
      <View style={styles.videoInfo}>
        <Text
          style={styles.videoTitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <Text style={styles.videoAuthor}>{item.author}</Text>
        <Text style={styles.videoViews}>{formatViews(item.views)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 分类列表 */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryList}
        />
      </View>
      
      {/* 视频列表 */}
      <FlatList
        data={filteredVideos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.videoColumnWrapper}
        showsVerticalScrollIndicator={false}
        style={styles.videoList}
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
  categoryContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryList: {
    paddingHorizontal: 8,
  },
  categoryItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  categoryItemSelected: {
    backgroundColor: '#1677ff',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  videoList: {
    flex: 1,
    padding: 8,
  },
  videoColumnWrapper: {
    justifyContent: 'space-between',
  },
  videoItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thumbnail: {
    height: ITEM_WIDTH * 0.56, // 16:9 比例
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailText: {
    color: '#999',
  },
  duration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
  },
  videoInfo: {
    padding: 8,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    height: 38, // 固定高度，显示两行
  },
  videoAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  videoViews: {
    fontSize: 12,
    color: '#999',
  },
});

export default VideoScreen; 