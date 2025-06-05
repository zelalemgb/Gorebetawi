const { getDefaultConfig } = require('@expo/metro-config');
const { resolver: { sourceExts, assetExts } } = getDefaultConfig(__dirname);

module.exports = {
  transformer: {
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  },
  resolver: {
    sourceExts,
    assetExts,
    resolveRequest: (context, moduleName, platform) => {
      // Alias react-native-maps and its native dependencies to a dummy module when building for web
      if (platform === 'web' && (
        moduleName.startsWith('react-native-maps') ||
        moduleName.startsWith('react-native/Libraries/Utilities/codegenNativeCommands') ||
        moduleName.includes('codegenNativeCommands')
      )) {
        return {
          filePath: require.resolve('./empty-module.js'),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};