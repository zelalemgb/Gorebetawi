const { getDefaultConfig } = require('@expo/metro-config');
const { resolver: { sourceExts, assetExts } } = getDefaultConfig(__dirname);

module.exports = {
  transformer: {
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  },
  resolver: {
    sourceExts,
    assetExts
  },
};