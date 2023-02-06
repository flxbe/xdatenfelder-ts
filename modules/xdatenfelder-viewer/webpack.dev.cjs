const { merge } = require("webpack-merge");
const webpack = require("webpack");
const common = require("./webpack.common.cjs");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    static: "./dist",
    historyApiFallback: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.BASE_URL": '"/"',
    }),
  ],
});
