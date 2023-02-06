const { merge } = require("webpack-merge");
const webpack = require("webpack");
const common = require("./webpack.common.cjs");

module.exports = merge(common, {
  mode: "production",
  plugins: [
    new webpack.DefinePlugin({
      "process.env.BASE_URL": '"/xdatenfelder-ts"',
    }),
  ],
});
