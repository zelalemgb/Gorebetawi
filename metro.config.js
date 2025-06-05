const { getDefaultConfig } = require('@expo/metro-config');

/**
 * Use Expo's default Metro configuration.
 * This automatically sets the correct `assetRegistryPath` so images
 * bundled by packages like `expo-router` resolve properly.
 */
module.exports = getDefaultConfig(__dirname);

