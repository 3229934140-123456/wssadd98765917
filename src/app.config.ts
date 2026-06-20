export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/history/index',
    'pages/mine/index',
    'pages/scan/index',
    'pages/check/index',
    'pages/result/index',
    'pages/detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1677ff',
    navigationBarTitleText: '冷链温区稽核',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#1677ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/history/index',
        text: '记录'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
