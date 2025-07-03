/**
 * 视频详情屏幕
 */
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  FlatList 
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { VideoStackParamList } from '../../navigation/types';

// 定义组件属性类型
type VideoDetailScreenProps = StackScreenProps<VideoStackParamList, 'VideoDetail'>;

// 视频详情类型
interface VideoDetail {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  subscribers: number;
  views: number;
  likes: number;
  dislikes: number;
  publishDate: string;
  description: string;
  tags: string[];
  videoUrl: string;
}

// 评论类型
interface Comment {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  time: string;
  likes: number;
  replies: number;
}

// 推荐视频类型
interface RecommendedVideo {
  id: string;
  title: string;
  author: string;
  views: number;
  duration: string;
  thumbnail?: string;
}

// 屏幕宽度
const { width } = Dimensions.get('window');

/**
 * 视频详情屏幕组件
 */
const VideoDetailScreen: React.FC<VideoDetailScreenProps> = ({ route, navigation }) => {
  // 获取路由参数
  const { id, videoUrl } = route.params;
  const [videoDetail, setVideoDetail] = useState<VideoDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<RecommendedVideo[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [loading, setLoading] = useState(true);

  // 模拟数据加载
  useEffect(() => {
    // 模拟网络请求
    const timer = setTimeout(() => {
      // 视频详情数据
      setVideoDetail({
        id,
        title: '如何用React Native开发跨平台应用',
        author: '编程教程',
        subscribers: 125000,
        views: 45600,
        likes: 3200,
        dislikes: 120,
        publishDate: '2023-06-01',
        description: 'React Native是Facebook推出的一个跨平台移动应用开发框架，可以使用JavaScript和React来开发iOS和Android应用。\n\n本视频详细介绍了React Native的基础知识，组件使用，以及如何构建一个完整的应用。适合有React基础但对React Native不熟悉的开发者观看。\n\n视频大纲：\n1. React Native简介\n2. 环境搭建\n3. 基础组件使用\n4. 导航和路由\n5. 状态管理\n6. 网络请求\n7. 原生模块集成\n8. 打包发布',
        tags: ['编程', 'React Native', '移动开发', '跨平台'],
        videoUrl,
      });

      // 评论数据
      setComments([
        {
          id: '1',
          author: '用户A',
          content: '非常实用的教程，学到了很多，感谢分享！',
          time: '3天前',
          likes: 45,
          replies: 2,
        },
        {
          id: '2',
          author: '用户B',
          content: '讲解很清晰，但是环境搭建部分可以详细一点。',
          time: '1周前',
          likes: 23,
          replies: 5,
        },
        {
          id: '3',
          author: '用户C',
          content: '对于初学者来说很友好，期待更多相关内容。',
          time: '2周前',
          likes: 18,
          replies: 0,
        },
      ]);

      // 推荐视频数据
      setRecommendedVideos([
        {
          id: '101',
          title: 'React Hooks完全指南',
          author: '编程教程',
          views: 78900,
          duration: '18:30',
        },
        {
          id: '102',
          title: 'Redux状态管理实战',
          author: '前端开发者',
          views: 45600,
          duration: '12:45',
        },
        {
          id: '103',
          title: 'TypeScript入门到精通',
          author: '编程学院',
          views: 56700,
          duration: '25:15',
        },
        {
          id: '104',
          title: 'React Native性能优化',
          author: '移动开发专家',
          views: 34500,
          duration: '15:10',
        },
      ]);

      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [id, videoUrl]);

  // 处理订阅
  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
  };

  // 处理点赞
  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
    } else {
      setIsLiked(true);
      if (isDisliked) {
        setIsDisliked(false);
      }
    }
  };

  // 处理踩
  const handleDislike = () => {
    if (isDisliked) {
      setIsDisliked(false);
    } else {
      setIsDisliked(true);
      if (isLiked) {
        setIsLiked(false);
      }
    }
  };

  // 切换描述展开/收起
  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toString();
  };

  // 渲染评论项
  const renderCommentItem = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAuthorAvatar}>
        <Text style={styles.commentAuthorAvatarText}>{item.author.charAt(0)}</Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.author}</Text>
          <Text style={styles.commentTime}>{item.time}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction}>
            <Text style={styles.commentActionText}>👍 {item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.commentAction}>
            <Text style={styles.commentActionText}>💬 {item.replies}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // 渲染推荐视频项
  const renderRecommendedVideoItem = ({ item }: { item: RecommendedVideo }) => (
    <TouchableOpacity style={styles.recommendedVideoItem}>
      <View style={styles.recommendedVideoThumbnail}>
        <Text style={styles.recommendedVideoThumbnailText}>缩略图</Text>
        <View style={styles.recommendedVideoDuration}>
          <Text style={styles.recommendedVideoDurationText}>{item.duration}</Text>
        </View>
      </View>
      <View style={styles.recommendedVideoInfo}>
        <Text 
          style={styles.recommendedVideoTitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <Text style={styles.recommendedVideoAuthor}>{item.author}</Text>
        <Text style={styles.recommendedVideoViews}>{formatNumber(item.views)}次观看</Text>
      </View>
    </TouchableOpacity>
  );

  // 加载状态
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>加载中...</Text>
      </View>
    );
  }

  // 数据为空
  if (!videoDetail) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>未找到视频</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 视频播放器（占位） */}
        <View style={styles.videoPlayer}>
          <Text style={styles.videoPlayerText}>视频播放器</Text>
        </View>

        {/* 视频信息 */}
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>{videoDetail.title}</Text>
          <View style={styles.videoStats}>
            <Text style={styles.videoViews}>
              {formatNumber(videoDetail.views)}次观看 • {videoDetail.publishDate}
            </Text>
            <View style={styles.videoActions}>
              <TouchableOpacity 
                style={styles.videoAction}
                onPress={handleLike}
              >
                <Text style={[styles.videoActionText, isLiked && styles.videoActionActive]}>
                  👍 {formatNumber(videoDetail.likes)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.videoAction}
                onPress={handleDislike}
              >
                <Text style={[styles.videoActionText, isDisliked && styles.videoActionActive]}>
                  👎 {formatNumber(videoDetail.dislikes)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.videoAction}>
                <Text style={styles.videoActionText}>🔗 分享</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.videoAction}>
                <Text style={styles.videoActionText}>⬇️ 下载</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 频道信息 */}
        <View style={styles.channelInfo}>
          <View style={styles.channelMain}>
            <View style={styles.channelAvatar}>
              <Text style={styles.channelAvatarText}>{videoDetail.author.charAt(0)}</Text>
            </View>
            <View style={styles.channelDetails}>
              <Text style={styles.channelName}>{videoDetail.author}</Text>
              <Text style={styles.channelSubscribers}>
                {formatNumber(videoDetail.subscribers)}位订阅者
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.subscribeButton, isSubscribed && styles.subscribedButton]}
            onPress={handleSubscribe}
          >
            <Text style={[styles.subscribeButtonText, isSubscribed && styles.subscribedButtonText]}>
              {isSubscribed ? '已订阅' : '订阅'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 视频描述 */}
        <View style={styles.descriptionContainer}>
          <Text 
            style={styles.description}
            numberOfLines={showFullDescription ? undefined : 3}
            ellipsizeMode="tail"
          >
            {videoDetail.description}
          </Text>
          <TouchableOpacity onPress={toggleDescription}>
            <Text style={styles.showMoreText}>
              {showFullDescription ? '收起' : '展开'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 标签 */}
        <View style={styles.tagsContainer}>
          {videoDetail.tags.map((tag, index) => (
            <TouchableOpacity key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 评论区 */}
        <View style={styles.commentsContainer}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>评论 ({comments.length})</Text>
          </View>
          {comments.map((comment) => renderCommentItem({ item: comment }))}
          <TouchableOpacity style={styles.viewAllComments}>
            <Text style={styles.viewAllCommentsText}>查看全部评论</Text>
          </TouchableOpacity>
        </View>

        {/* 推荐视频 */}
        <View style={styles.recommendedContainer}>
          <Text style={styles.recommendedTitle}>推荐视频</Text>
          {recommendedVideos.map((video) => renderRecommendedVideoItem({ item: video }))}
        </View>
      </ScrollView>
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
  videoPlayer: {
    width: '100%',
    height: width * 9 / 16, // 16:9 比例
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerText: {
    color: '#fff',
    fontSize: 16,
  },
  videoInfo: {
    padding: 12,
    backgroundColor: '#fff',
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  videoStats: {
    marginBottom: 8,
  },
  videoViews: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  videoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  videoAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  videoActionText: {
    fontSize: 14,
    color: '#666',
  },
  videoActionActive: {
    color: '#1677ff',
  },
  channelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  channelMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  channelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1677ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  channelDetails: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  channelSubscribers: {
    fontSize: 14,
    color: '#666',
  },
  subscribeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f50',
    borderRadius: 4,
  },
  subscribedButton: {
    backgroundColor: '#eee',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subscribedButtonText: {
    color: '#666',
  },
  descriptionContainer: {
    padding: 12,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  showMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#1677ff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  commentsContainer: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 12,
  },
  commentsHeader: {
    marginBottom: 12,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAuthorAvatarText: {
    fontSize: 16,
    color: '#666',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
  },
  commentAction: {
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    color: '#666',
  },
  viewAllComments: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewAllCommentsText: {
    fontSize: 14,
    color: '#1677ff',
  },
  recommendedContainer: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 12,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recommendedVideoItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recommendedVideoThumbnail: {
    width: 120,
    height: 68,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  recommendedVideoThumbnailText: {
    color: '#999',
    fontSize: 12,
  },
  recommendedVideoDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  recommendedVideoDurationText: {
    color: '#fff',
    fontSize: 10,
  },
  recommendedVideoInfo: {
    flex: 1,
  },
  recommendedVideoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recommendedVideoAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  recommendedVideoViews: {
    fontSize: 12,
    color: '#999',
  },
});

export default VideoDetailScreen; 