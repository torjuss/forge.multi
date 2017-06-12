var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var SRC_PATH = path.resolve(__dirname, 'public');
var LIBS_PATH = path.resolve(__dirname, 'libs');
var NODE_MODULES_PATH = path.resolve(__dirname, 'node_modules');

module.exports = {
  context: __dirname,

  // devtool: 'cheap-module-source-map',
  devtool: 'source-map',

  entry: {
    index: './public/index.js',
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dev'),
    publicPath: '/',
  },

  module: {
    rules: [{
        test: /\.css$/,
        loader:
          // ['style-loader', 'css-loader'],
          ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader',
          }),
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: './fonts/[name].[ext]',
          publicPath: '../',
        },
      },
      {
        test: /\.(png|svg|jpg|gif|ico)$/,
        loader: 'file-loader',
        options: {
          limit: 10000,
          name: './img/[name].[ext]',
          publicPath: '../',
        },
      },
      {
        test: /[\/\\]node_modules[\/\\]libs[\/\\]index\.js$/,
        loader: 'imports-loader?this=>window',
      },
    ],
  },

  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
    new ExtractTextPlugin({
      filename: 'styles.css',
    }),
    new HtmlWebpackPlugin({
      title: 'ISY 360 Rebar',
      template: './layout/index.ejs',
    }),
  ],

  resolve: {
    alias: {
      fs: 'fs-extra',
      jquery: 'jquery/src/jquery',
      libs: LIBS_PATH,
      css: path.resolve(SRC_PATH, 'css'),
      'bootstrap-select': 'bootstrap-select/dist',
    },
    modules: [SRC_PATH, NODE_MODULES_PATH, LIBS_PATH],
  },
}