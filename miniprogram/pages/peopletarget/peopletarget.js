//index.js
const app = getApp()

Page({
  data: {
    targetList: [],
    offset: 0,
    limit: 10,
  },

  onLoad: function () {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }

    // 打开调试
    if (app.globalData.debug) {
      wx.setEnableDebug({
        enableDebug: true
      })
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              console.log('[index][getuserinfo] res: ', res);
              app.globalData.userInfo = res.userInfo;
            }
          })
        } else {
          console.log('[index][getuserinfo]user not auth');
        }
      }
    })

    // 获取用户openid
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[index][getuseropenid]call cloudfunc login succ: ', res.result.openid);
        app.globalData.userOpenid = res.result.openid;
      },
      fail: err => {
        console.error('[index][getuseropenid]call cloudfunc login fail', err)
      }
    })
  },

  /**
  * 监听显示过程
  */
  onShow: function () {
    this.showTargetList();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.info("[peopletarget][onReachBottom]");
    this.showTargetList();
  },

  /**
   * 页面下拉事件的处理函数
   */
  onPullDownRefresh: function () {
    console.info("[peopletarget][onPullDownRefresh]");
    // 跳转到首页
    this.setData({
      targetList: [],
      offset: 0,
      limit: 10,
    });
    this.showTargetList();
  },

  // 拉取目标信息列表并展示
  showTargetList: function () {
    const db = wx.cloud.database();
    const _ = db.command;
    console.info("====>people offset:", this.data.offset)
    console.info("====>people limit:", this.data.limit)

    db.collection('targets').skip(this.data.offset).limit(this.data.limit).where({
      isopen: true,
      status: _.eq('ING').or(_.eq('DONE')),
    }).orderBy('gmt_create_time', 'desc')
      .get({
        success: res => {
          console.log("[peopletarget][showTargetList]load targetinfo: ", res.data);
          var newTargetList = this.data.targetList.concat(res.data);
          this.setData({
            targetList: newTargetList,
            offset: newTargetList.length
          });
        },
        fail: res => {
          console.log("[peopletarget][showTargetList]load targetinfo fail", res.data);
        }
      })
  },

  // 查看图片大图
  previewImageList: function (e) {
    var targetid = e.target.dataset.targetid;
    var picId = e.target.dataset.picid;

    wx.previewImage({
      current: this.data.targetList[targetid].fileIdList[picId],
      urls: this.data.targetList[targetid].fileIdList,
    });
  },

  onShareAppMessage: function () {
    return {
      title: '来一个可以实现的小目标',
      path: 'pages/index/index'
    }
  }
})
