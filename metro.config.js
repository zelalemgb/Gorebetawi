const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom resolver for web platform
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Redirect react-native-maps and its native dependencies to empty module on web platform
    if (platform === 'web') {
      if (
        moduleName === 'react-native-maps' ||
        moduleName === 'react-native/Libraries/Utilities/codegenNativeCommands'
      ) {
        return {
          filePath: `${__dirname}/empty-module.js`,
          type: 'sourceFile',
        };
      }
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;