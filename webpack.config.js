// @flow

const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/index.js',
  output: {
    pathinfo: true,
    path: path.resolve(__dirname, '_build', 'www'),
    publicPath: process.env.ASSETS_PUBLIC_PATH,
    filename: `assets/[name]-[hash].js`,
    chunkFilename: 'assets/[name].chunk.js',
    devtoolModuleFilenameTemplate: (info /*: Object */) => {
      path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
    }
  },
  devtool: 'cheap-module-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        VERSION: JSON.stringify(process.env.VERSION)
      }
    }),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
  ],
  module: {
    rules: [
      { test: /\.less$/, loader: 'css-loader!less-loader' },
      { test: /\.md$/, loader: 'raw-loader' },
      {
        test: /(robots\.txt)$/,
        use: [`file-loader?name=assets/[name].[ext]`]
      },
      {
        test: /\.(css)$/,
        use: [
          { loader: `style-loader` },
          {
            loader: `css-loader?name=assets/[name]-[hash].[ext]`
          }
        ]
      },
      {
        test: /\.(xml|fbx|ico|otf|eot|svg|ttf|woff|woff2)$/,
        use: [`file-loader?name=assets/[name]-[hash].[ext]`]
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: ['file-loader?name=assets/[name]-[hash].[ext]']
      }
    ]
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'vendors'
    },
    runtimeChunk: true
  },

  devServer: {
    contentBase: path.join(__dirname, '_build', 'www'), // boolean | string | array, static file location
    publicPath: process.env.ASSETS_PUBLIC_PATH,
    port: 30005,
    compress: true, // enable gzip compression
    historyApiFallback: true, // true for index.html upon 404, object for multiple paths
    hot: false, // hot module replacement. Depends on HotModuleReplacementPlugin
    https: true, // true for self-signed, object for cert authority
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    }
  }
}
