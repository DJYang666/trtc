// vue.config.js
const path = require('path')


let currDate =
  new Date().getFullYear() +
  '-' +
  (new Date().getMonth() + 1) +
  '-' +
  new Date().getDate()
let times = new Date().getHours() + '-' + new Date().getMinutes()

function resolve (dir) {
  return path.join(__dirname, dir)
}
// const LOCAL_IP = getIPAddress()
module.exports = {
  // 基本路径
  publicPath: './',
	lintOnSave: false,
  // 打包文件夹
  outputDir: path.resolve(
    __dirname,
    './dist/build/' + currDate + '/' + `院前出车PAD端${currDate}${times}`
  ),

  // 静态资源目录
  assetsDir: 'static',

  // 主页输出文件
  indexPath: 'index.html',

  // hash文件名
  filenameHashing: true,

  // 使用babel-loader转义列表中的组件
  transpileDependencies: [],

  // source map
  productionSourceMap: false,

  // devserve
  devServer: {
    index: 'index.html',
    host: '0.0.0.0',
    port: '1234',
  },

  chainWebpack: (config) => {
    config.resolve.alias.set('@', resolve('src'))

    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()

    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
  }

}