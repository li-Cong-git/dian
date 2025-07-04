/**
 * 导航类型定义文件
 */

// 导入角色类型
import { ROLES } from '../contexts/AuthContext';

// 身份验证堆栈导航参数类型
export type AuthStackParamList = {
  Login: undefined;
  Register: { userType?: ROLES };
  ForgotPassword: undefined;
  MerchantRegister: undefined; // 添加商家注册路由
};

// 主标签导航参数类型
export type RootTabParamList = {
  Home: undefined;
  Cart: undefined;
  Message: undefined;
  Video: undefined;
  Profile: undefined;
};

// 商家端标签导航参数类型
export type MerchantTabParamList = {
  MerchantHome: undefined;
  MerchantProducts: undefined;
  MerchantOrders: undefined;
  MerchantChat: undefined;
  MerchantProfile: undefined;
};

// 首页堆栈导航参数类型
export type HomeStackParamList = {
  HomeScreen: undefined;
  HomeDetail: { id: string; title: string };
};

// 购物车堆栈导航参数类型
export type CartStackParamList = {
  CartScreen: undefined;
  CartDetail: { id: string };
};

// 消息堆栈导航参数类型
export type MessageStackParamList = {
  MessageList: undefined;
  MessageDetail: { id: string; isRead: boolean };
};

// 视频堆栈导航参数类型
export type VideoStackParamList = {
  VideoScreen: undefined;
  VideoDetail: { id: string; title: string };
};

// 个人中心堆栈导航参数类型
export type ProfileStackParamList = {
  ProfileScreen: undefined;
  ProfileEdit: undefined;
  Settings: undefined;
  Address: undefined;
  Orders: undefined;
  OrderDetail: { id: string };
};

// 商家上传视频导航参数类型
export type UploadStackParamList = {
  UploadScreen: undefined;
  UploadDetail: { id?: string };
};

// 商家聊天导航参数类型
export type MerchantChatStackParamList = {
  MerchantChatList: undefined;
  MerchantChatDetail: { roomId: string; userId: string; userName: string };
};

// 商家中心导航参数类型
export type MerchantCenterStackParamList = {
  MerchantCenterScreen: undefined;
  OrderManagement: { status?: string } | undefined;
  OrderDetail: { id: string };
  MerchantSettings: undefined;
  ShopInfo: undefined;
  ChangePassword: undefined;
  Categories: undefined;
  PaymentSettings: undefined;
  ProductList: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
};

// 合并所有导航参数类型
export type RootStackParamList = 
  & AuthStackParamList
  & HomeStackParamList 
  & CartStackParamList 
  & MessageStackParamList 
  & VideoStackParamList 
  & ProfileStackParamList
  & UploadStackParamList
  & MerchantChatStackParamList
  & MerchantCenterStackParamList;

// 工具类型：获取路由名称
export type RouteName = keyof RootStackParamList;

// 导航类型声明（用于导航实例的类型）
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 