// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add missing extensions that Supabase might need
config.resolver.sourceExts.push('mjs', 'cjs');

module.exports = config;
