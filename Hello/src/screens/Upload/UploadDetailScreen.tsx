/**
 * 视频上传详情页面
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { UploadStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import merchantService from '../../services/merchant.service';
import videoService from '../../services/video.service';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import { API_BASE_URL } from '../../config/env';

// 定义组件属性类型
interface UploadDetailScreenProps {
  navigation: StackNavigationProp<UploadStackParamList, 'UploadDetail'>;
  route: RouteProp<UploadStackParamList, 'UploadDetail'>;
}

/**
 * 视频上传详情页面
 */
const UploadDetailScreen: React.FC<UploadDetailScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { id } = route.params || {};
  const isEditMode = !!id;

  // 表单状态
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [thumbnail, setThumbnail] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(isEditMode);

  // 如果是编辑模式，加载视频详情
  useEffect(() => {
    loadProducts();
    
    if (isEditMode) {
      loadVideoDetail();
    }
  }, [isEditMode, id]);
  
  /**
   * 加载视频详情
   */
  const loadVideoDetail = async () => {
    try {
      if (!id) return;
      
      const response = await videoService.getVideoById(id);
      
      if (response && response.data) {
        const videoData = response.data;
        
        setTitle(videoData.title);
        setDescription(videoData.description || '');
        
        // 构建缩略图或视频URL
        let thumbnailUrl = '';
        if (videoData.thumbnailUrl) {
          thumbnailUrl = videoData.thumbnailUrl.startsWith('http') 
            ? videoData.thumbnailUrl 
            : `${API_BASE_URL}${videoData.thumbnailUrl}`;
        } else if (videoData.videoUrl) {
          thumbnailUrl = videoData.videoUrl.startsWith('http') 
            ? videoData.videoUrl 
            : `${API_BASE_URL}${videoData.videoUrl}`;
        }
        
        setThumbnail(thumbnailUrl);
        
        if (videoData.productIds && videoData.productIds.length > 0) {
          const productIds = Array.isArray(videoData.productIds)
            ? videoData.productIds.map((p: any) => typeof p === 'object' ? p._id : p)
            : [];
          setSelectedProducts(productIds);
        }
        
        if (videoData.tags && videoData.tags.length > 0) {
          setTags(videoData.tags);
        }
      }
    } catch (error) {
      console.error('加载视频详情失败:', error);
      Alert.alert('错误', '无法加载视频详情，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 加载商品列表
   */
  const loadProducts = async () => {
    if (!user?._id) {
      return;
    }
    
    try {
      const response = await merchantService.getProducts({
        merchantId: user._id,
        status: 'on_sale',
        limit: 100
      });
      
      if (response && response.data) {
        setAvailableProducts(response.data);
      }
    } catch (error) {
      console.error('加载商品列表失败:', error);
      Alert.alert('提示', '加载商品列表失败，请稍后重试');
    }
  };

  /**
   * 从相册选择视频
   */
  const handleSelectFromGallery = async () => {
    try {
      const options = {
        mediaType: 'video' as const,
        quality: 1 as const,
        videoQuality: 'medium' as const,
        includeBase64: false,
        selectionLimit: 1
      };
      
      const result = await launchImageLibrary(options);
      
      if (result.didCancel) {
        console.log('用户取消了选择');
        return;
      }
      
      if (result.errorCode) {
        console.error('图片选择器错误: ', result.errorMessage);
        Alert.alert('错误', '选择视频时发生错误，请重试');
        return;
      }
      
      const video = result.assets?.[0];
      
      if (video) {
        console.log('选择的视频: ', video);
        // 检查文件大小，限制在50MB以内
        const fileSizeInMB = video.fileSize ? (video.fileSize / 1024 / 1024) : 0;
        
        if (fileSizeInMB > 50) {
          Alert.alert('文件过大', '请选择小于50MB的视频');
          return;
        }
        
        setSelectedVideo(video);
        setThumbnail(video.uri || '');
      }
    } catch (error) {
      console.error('选择视频错误: ', error);
      Alert.alert('错误', '选择视频时发生错误，请重试');
    }
  };
  
  /**
   * 从文件选择视频
   */
  const handleSelectFromFiles = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
        allowMultiSelection: false,
      });
      
      const file = results[0];
      console.log('选择的文件: ', file);
      
      // 检查文件大小，限制在50MB以内
      const fileSizeInBytes = file.size || 0;
      const fileSizeInMB = fileSizeInBytes / 1024 / 1024;
      
      if (fileSizeInMB > 50) {
        Alert.alert('文件过大', '请选择小于50MB的视频');
        return;
      }
      
      setSelectedVideo({
        uri: file.uri,
        type: file.type,
        name: file.name,
        size: file.size
      });
      setThumbnail(file.uri);
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('用户取消了选择');
      } else {
        console.error('文件选择错误: ', error);
        Alert.alert('错误', '选择视频时发生错误，请重试');
      }
    }
  };

  /**
   * 处理选择视频
   */
  const handleSelectVideo = () => {
    Alert.alert(
      '选择视频',
      '请选择视频来源',
      [
        { 
          text: '取消',
          style: 'cancel' 
        },
        {
          text: '从相册选择',
          onPress: handleSelectFromGallery
        },
        {
          text: '从文件选择',
          onPress: handleSelectFromFiles
        }
      ]
    );
  };

  /**
   * 处理选择商品
   */
  const handleSelectProducts = async () => {
    try {
      if (availableProducts.length === 0) {
        Alert.alert('提示', '您还没有上架的商品，请先添加商品');
        return;
      }
      
      // 显示商品选择对话框
      Alert.alert(
        '选择关联商品',
        `您有 ${availableProducts.length} 件在售商品，请选择要关联的商品`,
        [
          { text: '取消' },
          {
            text: '选择全部',
            onPress: () => {
              const productIds = availableProducts.map(p => p._id);
              setSelectedProducts(productIds);
            }
          },
          {
            text: '清除选择',
            onPress: () => {
              setSelectedProducts([]);
            }
          }
        ]
      );
    } catch (error) {
      console.error('选择商品失败:', error);
      Alert.alert('错误', '选择商品失败，请稍后重试');
    }
  };

  /**
   * 添加标签
   */
  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  /**
   * 删除标签
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  /**
   * 准备视频文件以供上传
   */
  const prepareVideoForUpload = async () => {
    if (!selectedVideo || !selectedVideo.uri) {
      throw new Error('没有选择视频');
    }
    
    try {
      // 创建表单数据
      const formData = new FormData();
      
      // 根据不同平台处理文件路径
      const fileUri = Platform.OS === 'android' 
        ? selectedVideo.uri 
        : selectedVideo.uri.replace('file://', '');
      
      // 添加视频文件
      formData.append('video', {
        uri: fileUri,
        type: selectedVideo.type || 'video/mp4',
        name: selectedVideo.name || 'video.mp4'
      } as any);
      
      // 添加其他表单字段
      formData.append('title', title);
      formData.append('description', description);
      
      if (selectedProducts.length > 0) {
        formData.append('productIds', JSON.stringify(selectedProducts));
      }
      
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }
      
      return formData;
    } catch (error) {
      console.error('准备视频上传失败:', error);
      throw error;
    }
  };

  /**
   * 准备更新数据
   */
  const prepareUpdateData = () => {
    const formData = new FormData();
    
    formData.append('title', title);
    formData.append('description', description);
    
    if (selectedProducts.length > 0) {
      formData.append('productIds', JSON.stringify(selectedProducts));
    }
    
    if (tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }
    
    // 如果有新的缩略图
    if (selectedVideo && selectedVideo.uri) {
      const fileUri = Platform.OS === 'android' 
        ? selectedVideo.uri 
        : selectedVideo.uri.replace('file://', '');
      
      formData.append('thumbnail', {
        uri: fileUri,
        type: 'image/jpeg',
        name: 'thumbnail.jpg'
      } as any);
    }
    
    return formData;
  };

  /**
   * 处理提交
   */
  const handleSubmit = async () => {
    // 表单验证
    if (!title.trim()) {
      Alert.alert('提示', '请输入视频标题');
      return;
    }

    if (!isEditMode && !selectedVideo) {
      Alert.alert('提示', '请选择要上传的视频');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(0);
      
      if (isEditMode && id) {
        // 更新视频信息
        const updateData = prepareUpdateData();
        await videoService.updateVideo(id, updateData);
        
        Alert.alert(
          '成功',
          '视频信息已更新',
          [
            {
              text: '确定',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        // 上传新视频
        const formData = await prepareVideoForUpload();
        
        // 设置进度回调
        const onProgress = (progress: number) => {
          setUploadProgress(progress);
        };
        
        // 上传视频
        await videoService.uploadVideo(formData, onProgress);
        
        Alert.alert(
          '成功',
          '视频上传成功',
          [
            {
              text: '确定',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      console.error('操作失败:', error);
      Alert.alert('错误', '操作失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 渲染内容
   */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1677ff" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // 渲染已选择的商品信息
  const renderSelectedProductsInfo = () => {
    if (selectedProducts.length === 0) {
      return "尚未选择商品";
    }
    
    const productNames = selectedProducts.map(id => {
      const product = availableProducts.find(p => p._id === id);
      return product ? product.name : '未知商品';
    }).filter(Boolean);
    
    return `已选择 ${selectedProducts.length} 个商品: ${productNames.join(', ')}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 页面标题 */}
        <Text style={styles.pageTitle}>{isEditMode ? '编辑视频' : '上传视频'}</Text>
        
        {/* 视频选择/预览 */}
        <View style={styles.videoPreviewContainer}>
          {thumbnail ? (
            <View style={{width: '100%', height: 200}}>
              <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
              {selectedVideo && (
                <View style={styles.videoInfoBadge}>
                  <Text style={styles.videoInfoText}>
                    {selectedVideo.name || '已选择视频'}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>视频预览区</Text>
            </View>
          )}
          
          {!isEditMode && (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={handleSelectVideo}
              disabled={isSubmitting}
            >
              <Text style={styles.selectButtonText}>选择视频</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* 视频信息表单 */}
        <View style={styles.formContainer}>
          {/* 标题 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>视频标题 <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="请输入视频标题"
              placeholderTextColor="#999"
              maxLength={50}
              editable={!isSubmitting}
            />
          </View>
          
          {/* 描述 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>视频描述</Text>
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              placeholder="请输入视频描述"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>
          
          {/* 关联商品 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>关联商品</Text>
            <TouchableOpacity
              style={styles.selectProductsButton}
              onPress={handleSelectProducts}
              disabled={isSubmitting}
            >
              <Text style={styles.selectProductsButtonText}>
                {selectedProducts.length > 0 
                  ? `已选择 ${selectedProducts.length} 个商品` 
                  : '选择关联商品'}
              </Text>
            </TouchableOpacity>
            
            {selectedProducts.length > 0 && (
              <Text style={styles.selectedProductsInfo}>
                {renderSelectedProductsInfo()}
              </Text>
            )}
          </View>
          
          {/* 标签 */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>添加标签</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={currentTag}
                onChangeText={setCurrentTag}
                placeholder="输入标签"
                placeholderTextColor="#999"
                editable={!isSubmitting}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleAddTag}
                disabled={isSubmitting || !currentTag.trim()}
              >
                <Text style={styles.addTagButtonText}>添加</Text>
              </TouchableOpacity>
            </View>
            
            {/* 标签列表 */}
            {tags.length > 0 && (
              <View style={styles.tagList}>
                {tags.map(tag => (
                  <View key={tag} style={styles.tagItem}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTag(tag)}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.removeTagText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {/* 上传进度 */}
          {isSubmitting && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${uploadProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          )}
          
          {/* 提交按钮 */}
          <TouchableOpacity
            style={[
              styles.submitButton, 
              isSubmitting && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditMode ? '保存修改' : '上传视频'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  videoPreviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  placeholderContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  videoInfoBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 4,
  },
  videoInfoText: {
    color: '#fff',
    fontSize: 12,
  },
  selectButton: {
    backgroundColor: '#1677ff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: '#f44336',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  textarea: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    height: 100,
  },
  selectProductsButton: {
    borderWidth: 1,
    borderColor: '#1677ff',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  selectProductsButtonText: {
    color: '#1677ff',
    fontSize: 16,
  },
  selectedProductsInfo: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: '#1677ff',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 4,
  },
  addTagButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  removeTagText: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1677ff',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: '#1677ff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#84b7ff',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UploadDetailScreen; 