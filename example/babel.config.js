// The library is resolved straight to `src/` by the custom export condition in
// metro.config.js, so Metro transforms its TypeScript here with the app's own
// Babel setup — including react-native-worklets/plugin, which is what compiles
// the library's `'worklet'` directives.
//
// NOTE: react-native-builder-bob's `getConfig` helper is deliberately not used.
// It emits pattern-based `overrides`, and Expo SDK 57's Metro babel-transformer
// calls Babel without a filename when computing its cache key, which throws
// "Configuration contains string/RegExp pattern, but no filename was passed".
module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
  };
};
