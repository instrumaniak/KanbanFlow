const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (options) {
  return {
    ...options,
    entry: {
      app: './src/main.ts',
      migrate: './src/scripts/migrate.ts',
      'create-admin': './src/scripts/create-admin.ts',
    },
    output: {
      ...options.output,
      path: path.join(__dirname, 'release'),
      filename: '[name].js',
      chunkFilename: '[name].js',
    },
    externals: [
      ({ request }, callback) => {
        if (request === 'bcrypt') {
          return callback(null, 'commonjs bcrypt');
        }
        callback();
      },
    ],
    optimization: {
      ...options.optimization,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            // Migration class names are persisted in the typeorm_migrations table.
            // DTO class names are used by Swagger/OpenAPI schema generation.
            // Entity class names are referenced by decorators but keeping them is safest.
            keep_classnames: true,
            keep_fnames: false,
            compress: {
              drop_console: false,
              drop_debugger: true,
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
      splitChunks: {
        chunks: 'all',
        minSize: 0,
        cacheGroups: {
          default: false,
          common: {
            name: 'common',
            chunks: 'all',
            minChunks: 2,
            priority: 10,
          },
        },
      },
      usedExports: true,
      sideEffects: false,
    },
  };
};
