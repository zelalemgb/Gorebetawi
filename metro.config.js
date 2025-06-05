const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom resolver for web platform
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Redirect react-native-maps to empty module on web platform
    if (platform === 'web' && moduleName === 'react-native-maps') {
      return {
        filePath: `${__dirname}/empty-module.js`,
        type: 'sourceFile',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;