/**
 * Metro配置
 * https://facebook.github.io/metro/docs/configuration
 */

const { getDefaultConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

// 确保正确处理转译选项
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// 确保正确处理资源
config.resolver.assetExts.push('bin');

// 确保正确解析模块
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

// 导出配置
module.exports = config;
