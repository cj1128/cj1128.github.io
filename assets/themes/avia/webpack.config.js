/*
* @Author: CJ Ting
* @Date: 2016-11-04 13:38:40
* @Email: cj.ting@fugetech.com
*/

var path = require("path")
var webpack = require("webpack")

var env = process.env.NODE_ENV || "dev"

var devPlugins = []
var productionPlugins = [
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
    },
  })
]

module.exports = {
  entry: {
    style: "./style.js",
    desktop: "./desktop-entry.js",
    mobile: "./mobile-entry.js",
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "./[name].bundle.js",
  },
  module: {
    loaders: [
      {
        test: /\.styl$/,
        exclude: /node_modules/,
        loader: "style!css!stylus",
      },
      {
        test: /\.css$/,
        loader: "style!css",
      },
    ],
  },
  plugins: env === "dev" ? devPlugins : productionPlugins,
}
