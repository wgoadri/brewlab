module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Lets Drizzle's generated migrations bundle the .sql files directly.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
