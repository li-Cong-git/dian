# 项目依赖说明文档

本项目包含两个主要部分：前端应用（React Native）和后端服务（Node.js/Express）。以下是项目的依赖说明和安装步骤。

## 项目结构

项目分为三个主要部分：

1. `/Hello` - 前端应用（React Native）
2. `/hello_after` - 后端服务（Express/MongoDB）
3. `/gzl` - 语音服务后端（Express）

## 前端依赖（/Hello）

前端使用React Native构建，需要以下核心依赖：

### 核心依赖

```json
{
  "react": "19.1.0",
  "react-native": "0.80.1",
  "@react-navigation/native": "^7.1.14",
  "@react-navigation/stack": "^7.4.2",
  "@react-navigation/bottom-tabs": "^7.4.2"
}
```

### 语音助手相关依赖

```json
{
  "axios": "^1.10.0",
  "react-native-audio-recorder-player": "^3.5.3",
  "expo-av": "^13.10.0",
  "expo-file-system": "^16.0.5",
  "@expo/vector-icons": "^13.0.0"
}
```

### 安装步骤

1. 进入前端项目目录：

```bash
cd Hello
```

2. 安装依赖：

```bash
npm install
```

3. 启动开发服务器：

```bash
npm start
```

4. 在另一个终端运行应用：

```bash
# Android
npm run android

# iOS
npm run ios
```

## 后端依赖（/hello_after）

后端主服务使用Express和MongoDB构建，负责处理用户、商品、订单等核心业务功能。

### 核心依赖

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "body-parser": "^1.20.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.1"
}
```

### 安装步骤

1. 进入后端项目目录：

```bash
cd hello_after
```

2. 安装依赖：

```bash
npm install
```

3. 创建`.env`文件，添加以下配置：

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/shopping_app
JWT_SECRET=your_jwt_secret_key
```

4. 启动MongoDB服务器（需要先安装MongoDB）

5. 启动后端服务：

```bash
npm start
```

## 语音服务后端依赖（/gzl）

语音服务后端处理语音识别、语音合成和AI对话等功能。

### 核心依赖

```json
{
  "express": "^4.18.2",
  "axios": "^1.10.0",
  "multer": "^1.4.5-lts.1",
  "ws": "^8.14.2",
  "crypto": "^1.0.1",
  "dotenv": "^16.3.1"
}
```

### 安装步骤

1. 进入语音服务后端目录：

```bash
cd gzl
```

2. 安装依赖：

```bash
npm install
```

3. 创建`.env`文件，添加以下配置：

```
PORT=3001
# 讯飞语音服务配置
XFYUN_APP_ID=your_xfyun_app_id
XFYUN_API_KEY=your_xfyun_api_key
XFYUN_API_SECRET=your_xfyun_api_secret

# Coze API配置
COZE_API_KEY=your_coze_api_key
COZE_SPACE_ID=your_coze_space_id
COZE_BOT_ID=your_coze_bot_id
COZE_WORKFLOW_ID=your_coze_workflow_id
```

4. 启动语音服务后端：

```bash
npm start
```

## 第三方服务申请

### 1. 讯飞开放平台

语音识别和语音合成功能需要申请讯飞开放平台的服务：

1. 前往[讯飞开放平台](https://www.xfyun.cn/)注册账号
2. 创建应用并开通以下能力：
   - 语音听写（流式版）
   - 在线语音合成
3. 获取应用的APP_ID、API_KEY和API_SECRET
4. 将这些凭据添加到语音服务后端的`.env`文件中

### 2. Coze AI

智能对话功能需要申请Coze平台的服务：

1. 前往[Coze平台](https://www.coze.com)注册账号
2. 创建一个机器人和工作流
3. 获取相关的API_KEY、SPACE_ID、BOT_ID和WORKFLOW_ID
4. 将这些凭据添加到语音服务后端的`.env`文件中

## 数据库设置

本项目使用MongoDB作为数据库。您需要：

1. 下载并安装[MongoDB社区版](https://www.mongodb.com/try/download/community)
2. 创建一个名为`shopping_app`的数据库
3. 初始数据将在应用首次运行时自动创建

## 系统要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 6.0.0
- Android Studio (用于Android开发)
- Xcode (用于iOS开发，仅Mac系统)
- 讯飞开放平台账号
- Coze平台账号

## 常见问题解决

1. **前端网络请求错误**：确保后端服务正在运行，并检查API地址配置是否正确。

2. **语音服务不可用**：检查讯飞API凭据是否正确配置。

3. **MongoDB连接失败**：确保MongoDB服务已启动并运行在默认端口（27017）。

4. **React Native构建错误**：
   - 清除缓存: `npx react-native start --reset-cache`
   - 重新安装依赖: `rm -rf node_modules && npm install`

5. **iOS构建问题**：
   - 清理Xcode构建: `cd ios && pod install && cd ..`

6. **Android构建问题**：
   - 清理Gradle缓存: `cd android && ./gradlew clean && cd ..` 