const { merge } = require("webpack-merge");
//const BundleAnalyzerPlugin =
//require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const common = require("./webpack.common.cjs");

module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",
  // plugins: [new BundleAnalyzerPlugin()],
});
