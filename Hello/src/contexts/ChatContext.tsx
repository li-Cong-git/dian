/**
 * 聊天上下文
 * 管理WebSocket连接和聊天状态
 */
import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/env';

// 消息类型定义
export interface ChatMessage {
  messageId: string;
  roomId: string;
  senderId: string;
  senderType: 'user' | 'merchant';
  receiverId: string;
  receiverType: 'user' | 'merchant';
  content: string;
  messageType: 'text' | 'image' | 'product' | 'order' | 'system';
  metadata?: any;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isRead: boolean;
  isDeleted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 聊天室类型定义
export interface ChatRoom {
  roomId: string;
  userId: string;
  merchantId: string;
  userInfo: {
    username: string;
    avatar?: string;
    nickname?: string;
  };
  merchantInfo: {
    name: string;
    logo?: string;
    accountName: string;
  };
  lastMessage?: {
    content: string;
    senderId: string;
    senderType: 'user' | 'merchant';
    timestamp: Date | string;
  };
  unreadCount: {
    user: number;
    merchant: number;
  };
  status: 'active' | 'archived' | 'blocked';
  createdAt: Date | string;
  updatedAt: Date | string;
}

// 通知类型定义
export interface ChatNotification {
  type: 'new_message' | 'read_receipt' | 'user_typing';
  roomId: string;
  senderId: string;
  senderType: 'user' | 'merchant';
  message?: string;
  timestamp?: Date | string;
}

// 聊天上下文类型定义
interface ChatContextType {
  socket: Socket | null;
  connected: boolean;
  connecting: boolean;
  currentRoom: string | null;
  messages: Record<string, ChatMessage[]>;
  rooms: ChatRoom[];
  unreadCount: number;
  
  // 方法
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (roomId: string, content: string, receiverId: string, messageType?: string, metadata?: any) => Promise<boolean>;
  markAsRead: (roomId: string) => void;
  getRooms: () => Promise<void>;
  clearMessages: (roomId: string) => void;
}

// 创建上下文
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 聊天提供者属性
interface ChatProviderProps {
  children: ReactNode;
}

/**
 * 聊天上下文提供者组件
 */
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // 引用存储当前的socket实例，用于在useEffect清理函数中访问最新的socket
  const socketRef = useRef<Socket | null>(null);
  
  /**
   * 连接WebSocket
   */
  const connect = async () => {
    if (!isAuthenticated || !user || connecting || connected || socket) {
      return;
    }
    
    try {
      setConnecting(true);
      
      // 获取认证令牌
      const token = await AsyncStorage.getItem('auth_token');
      
      if (!token) {
        console.error('无法连接WebSocket：缺少认证令牌');
        setConnecting(false);
        return;
      }
      
      // 创建Socket.io实例
      const socketInstance = io(`${API_BASE_URL}`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        auth: {
          token,
          userId: user._id,
          userType: user.role // 'user' 或 'merchant'
        }
      });
      
      // 连接成功
      socketInstance.on('connect', () => {
        console.log('WebSocket连接成功');
        setConnected(true);
        setConnecting(false);
      });
      
      // 连接错误
      socketInstance.on('connect_error', (error) => {
        console.error('WebSocket连接错误:', error);
        setConnected(false);
        setConnecting(false);
      });
      
      // 断开连接
      socketInstance.on('disconnect', (reason) => {
        console.log('WebSocket断开连接:', reason);
        setConnected(false);
      });
      
      // 接收新消息
      socketInstance.on('new_message', (message: ChatMessage) => {
        const { roomId } = message;
        console.log('收到新消息:', message);
        
        // 更新消息列表
        setMessages(prevMessages => {
          const roomMessages = [...(prevMessages[roomId] || [])];
          // 检查消息是否已存在
          if (!roomMessages.find(m => m.messageId === message.messageId)) {
            roomMessages.push(message);
          }
          return {
            ...prevMessages,
            [roomId]: roomMessages
          };
        });
        
        // 更新房间列表中的最后一条消息
        updateRoomLastMessage(roomId, message);
      });
      
      // 接收消息已读通知
      socketInstance.on('messages_read', (data: { roomId: string, readerId: string, readerType: string }) => {
        const { roomId, readerId, readerType } = data;
        console.log('消息已读通知:', data);
        
        // 更新消息状态
        setMessages(prevMessages => {
          const roomMessages = [...(prevMessages[roomId] || [])];
          const updatedMessages = roomMessages.map(msg => {
            // 如果消息的接收者是已读通知的发送者，则将消息标记为已读
            if (msg.receiverId === readerId && msg.receiverType === readerType) {
              return { ...msg, isRead: true, status: 'read' as const };
            }
            return msg;
          });
          
          return {
            ...prevMessages,
            [roomId]: updatedMessages
          };
        });
        
        // 更新房间的未读计数
        setRooms(prevRooms => {
          return prevRooms.map(room => {
            if (room.roomId === roomId) {
              const updatedRoom = { ...room };
              if (readerType === 'user') {
                updatedRoom.unreadCount.user = 0;
              } else if (readerType === 'merchant') {
                updatedRoom.unreadCount.merchant = 0;
              }
              return updatedRoom;
            }
            return room;
          });
        });
      });
      
      // 接收通知
      socketInstance.on('notification', (notification: ChatNotification) => {
        console.log('收到通知:', notification);
        
        // 根据通知类型处理
        if (notification.type === 'new_message') {
          // 更新未读消息计数
          calculateUnreadCount();
          
          // 如果不在当前聊天室，则更新相应聊天室的未读计数
          if (currentRoom !== notification.roomId) {
            setRooms(prevRooms => {
              return prevRooms.map(room => {
                if (room.roomId === notification.roomId) {
                  const updatedRoom = { ...room };
                  // 根据用户类型更新未读计数
                  if (user.role === 'user') {
                    updatedRoom.unreadCount.user += 1;
                  } else {
                    updatedRoom.unreadCount.merchant += 1;
                  }
                  return updatedRoom;
                }
                return room;
              });
            });
          }
        }
      });
      
      // 接收历史消息
      socketInstance.on('history_messages', (data: { roomId: string, messages: ChatMessage[] }) => {
        console.log(`收到聊天室 ${data.roomId} 的历史消息:`, data.messages.length);
        
        setMessages(prevMessages => {
          return {
            ...prevMessages,
            [data.roomId]: data.messages
          };
        });
      });
      
      // 加入房间确认
      socketInstance.on('joined_room', (data: { roomId: string }) => {
        console.log(`成功加入聊天室: ${data.roomId}`);
        setCurrentRoom(data.roomId);
      });
      
      // 错误处理
      socketInstance.on('error', (error: any) => {
        console.error('WebSocket错误:', error);
      });
      
      // 保存socket实例
      setSocket(socketInstance);
      socketRef.current = socketInstance;
      
      // 获取聊天室列表
      getRooms();
      
    } catch (error) {
      console.error('WebSocket连接过程中出错:', error);
      setConnecting(false);
    }
  };
  
  /**
   * 断开WebSocket连接
   */
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      socketRef.current = null;
      setConnected(false);
      setCurrentRoom(null);
    }
  };
  
  /**
   * 加入聊天室
   * @param {string} roomId - 聊天室ID
   */
  const joinRoom = (roomId: string) => {
    if (!socket || !connected) {
      console.error('WebSocket未连接，无法加入聊天室');
      return;
    }
    
    // 如果已经在其他聊天室，先离开
    if (currentRoom && currentRoom !== roomId) {
      leaveRoom(currentRoom);
    }
    
    console.log(`尝试加入聊天室: ${roomId}`);
    socket.emit('join_room', { roomId });
    
    // 标记为已读
    markAsRead(roomId);
  };
  
  /**
   * 离开聊天室
   * @param {string} roomId - 聊天室ID
   */
  const leaveRoom = (roomId: string) => {
    if (!socket || !connected) {
      return;
    }
    
    console.log(`离开聊天室: ${roomId}`);
    socket.emit('leave_room', { roomId });
    
    if (currentRoom === roomId) {
      setCurrentRoom(null);
    }
  };
  
  /**
   * 发送消息
   * @param {string} roomId - 聊天室ID
   * @param {string} content - 消息内容
   * @param {string} receiverId - 接收者ID
   * @param {string} messageType - 消息类型
   * @param {any} metadata - 附加数据
   * @returns {Promise<boolean>} 是否发送成功
   */
  const sendMessage = async (
    roomId: string,
    content: string,
    receiverId: string,
    messageType: string = 'text',
    metadata: any = {}
  ): Promise<boolean> => {
    if (!socket || !connected || !user) {
      console.error('WebSocket未连接或用户未登录，无法发送消息');
      return false;
    }
    
    try {
      // 准备消息数据
      const messageData = {
        roomId,
        content,
        receiverId,
        messageType,
        metadata
      };
      
      // 发送消息
      socket.emit('send_message', messageData);
      
      return true;
    } catch (error) {
      console.error('发送消息错误:', error);
      return false;
    }
  };
  
  /**
   * 标记消息为已读
   * @param {string} roomId - 聊天室ID
   */
  const markAsRead = (roomId: string) => {
    if (!socket || !connected || !user) {
      console.error('WebSocket未连接或用户未登录，无法标记消息已读');
      return;
    }
    
    socket.emit('mark_as_read', { roomId });
    
    // 更新本地状态
    setRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.roomId === roomId) {
          const updatedRoom = { ...room };
          // 根据用户类型更新未读计数
          if (user.role === 'user') {
            updatedRoom.unreadCount.user = 0;
          } else {
            updatedRoom.unreadCount.merchant = 0;
          }
          return updatedRoom;
        }
        return room;
      });
    });
    
    // 重新计算未读消息总数
    calculateUnreadCount();
  };
  
  /**
   * 获取聊天室列表
   */
  const getRooms = async () => {
    if (!user || !isAuthenticated) {
      console.error('用户未登录，无法获取聊天室列表');
      return;
    }
    
    try {
      console.log('正在获取聊天室列表，用户类型:', user.role, '用户ID:', user._id);
      
      const endpoint = user.role === 'user'
        ? `${API_BASE_URL}/api/v1/chat/user/${user._id}`
        : `${API_BASE_URL}/api/v1/chat/merchant/${user._id}`;
      
      console.log('请求URL:', endpoint);
      
      const token = await AsyncStorage.getItem('auth_token');
      console.log('使用Token:', token?.substring(0, 15) + '...');
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('API响应状态:', response.status);
      const result = await response.json();
      console.log('API响应数据:', JSON.stringify(result).substring(0, 200) + '...');
      
      if (result.success) {
        setRooms(result.data || []);
        calculateUnreadCount();
        console.log('成功获取聊天室:', result.data?.length || 0, '个');
      } else {
        console.error('获取聊天室列表失败:', result.message);
      }
    } catch (error) {
      console.error('获取聊天室列表错误:', error);
    }
  };
  
  /**
   * 清除指定聊天室的消息
   * @param {string} roomId - 聊天室ID
   */
  const clearMessages = (roomId: string) => {
    setMessages(prevMessages => {
      const newMessages = { ...prevMessages };
      delete newMessages[roomId];
      return newMessages;
    });
  };
  
  /**
   * 计算未读消息总数
   */
  const calculateUnreadCount = () => {
    let count = 0;
    
    rooms.forEach(room => {
      // 根据用户类型获取未读计数
      if (user?.role === 'user') {
        count += room.unreadCount.user;
      } else if (user?.role === 'merchant') {
        count += room.unreadCount.merchant;
      }
    });
    
    setUnreadCount(count);
  };
  
  /**
   * 更新房间最后一条消息
   * @param {string} roomId - 聊天室ID
   * @param {ChatMessage} message - 消息
   */
  const updateRoomLastMessage = (roomId: string, message: ChatMessage) => {
    setRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.roomId === roomId) {
          return {
            ...room,
            lastMessage: {
              content: message.content,
              senderId: message.senderId,
              senderType: message.senderType,
              timestamp: message.createdAt
            }
          };
        }
        return room;
      });
    });
  };
  
  // 用户认证状态变化时连接/断开WebSocket
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }
    
    // 清理函数
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, user]);
  
  // 计算未读消息数
  useEffect(() => {
    calculateUnreadCount();
  }, [rooms]);
  
  // 导出上下文值
  const contextValue: ChatContextType = {
    socket,
    connected,
    connecting,
    currentRoom,
    messages,
    rooms,
    unreadCount,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendMessage,
    markAsRead,
    getRooms,
    clearMessages
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * 使用聊天上下文的Hook
 */
export const useChat = () => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
};

export default ChatContext; 