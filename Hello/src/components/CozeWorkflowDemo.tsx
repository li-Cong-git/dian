/**
 * CozeWorkflowDemo.tsx
 * React Native组件，演示如何与Coze工作流API交互
 */
import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

// 导入API配置
import { apiClient, API_PATHS } from '../services/api';
// 导入API工具函数
import { extractCozeResponseText, formatApiError, isSuccessResponse } from '../utils/apiUtils';

// 定义类型
interface CozeResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface CozeWorkflowDemoProps {
  // 可以添加组件属性类型
}

/**
 * Coze工作流演示组件
 */
const CozeWorkflowDemo: React.FC<CozeWorkflowDemoProps> = () => {
  // 状态管理
  const [userInput, setUserInput] = useState<string>('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 调用Coze工作流API
   */
  const executeWorkflow = async (): Promise<void> => {
    if (!userInput.trim()) {
      setError('请输入问题或指令');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 调用API服务，更新请求格式
      const result = await apiClient.post<CozeResponse>(API_PATHS.COZE.EXECUTE, {
        inputs: {
          userQuery: userInput
        }
      });
      
      // result是经过axios拦截器处理后的数据对象，不是AxiosResponse
      if (isSuccessResponse(result)) {
        // 使用工具函数处理响应
        const responseText = extractCozeResponseText(result);
        setResponse(responseText);
      } else {
        // 处理错误响应
        setError((result as any).message || '执行工作流失败');
      }
    } catch (err: any) {
      console.error('执行工作流错误:', err);
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 渲染响应结果
   */
  const renderResponse = (): React.ReactNode => {
    if (!response) return null;
    
    // 根据响应类型渲染不同的UI
    if (typeof response === 'string') {
      return (
        <View style={styles.responseContainer}>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      );
    } else if (Array.isArray(response)) {
      // 处理可能的数组格式响应
      return (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>工作流响应:</Text>
          <ScrollView style={styles.jsonContainer}>
            {response.map((item, index) => {
              if (typeof item === 'object' && item.type === 'text' && item.text) {
                return <Text key={index} style={styles.responseText}>{item.text}</Text>;
              } else {
                return <Text key={index} style={styles.jsonText}>{JSON.stringify(item, null, 2)}</Text>;
              }
            })}
          </ScrollView>
        </View>
      );
    } else if (typeof response === 'object') {
      return (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>工作流响应:</Text>
          <ScrollView style={styles.jsonContainer}>
            <Text style={styles.jsonText}>
              {JSON.stringify(response, null, 2)}
            </Text>
          </ScrollView>
        </View>
      );
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coze工作流演示</Text>
        <Text style={styles.subtitle}>输入问题或指令，与AI助手交互</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="请输入问题或指令..."
          value={userInput}
          onChangeText={setUserInput}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        
        <TouchableOpacity
          style={styles.button}
          onPress={executeWorkflow}
          disabled={loading || !userInput.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>发送</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1677ff" />
          <Text style={styles.loadingText}>正在处理您的请求...</Text>
        </View>
      ) : (
        renderResponse()
      )}
    </View>
  );
};

// 样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    marginRight: 8,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#1677ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  responseContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  responseText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  jsonContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 8,
  },
  jsonText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
});

export default CozeWorkflowDemo; 