//index.js
const app = getApp()

Page({
  data: {
    targetList: [],
    offset: 0,
    limit: 10,
  },

  onLoad: function() {
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
    console.info("[index][onReachBottom]");
    this.showTargetList();
  },

  /**
   * 页面下拉事件的处理函数
   */
  onPullDownRefresh: function () {
    console.info("[index][onPullDownRefresh]");
    // 跳转到首页
    this.setData({
      targetList: [],
      offset: 0,
      limit: 10,
    });
    this.showTargetList();
  },

  /**
  * 拉取目标信息列表并展示
  */
  showTargetList: function () {
    const db = wx.cloud.database();
    const _ = db.command;
    console.info("====>index offset:", this.data.offset)
    console.info("====>index limit:", this.data.limit)

    db.collection('targets').skip(this.data.offset).limit(this.data.limit).where({
      _openid: app.globalData.userOpenid,
      status: _.eq('ING').or(_.eq('DONE')),
    }).orderBy('gmt_create_time', 'desc')
      .get({
        success: res => {
          console.log("[index][showTargetList]load targetinfo", res.data);
          var newTargetList = this.data.targetList.concat(res.data);
          this.setData({
            targetList: newTargetList,
            offset: newTargetList.length
          });
        },
        fail: res => {
          console.log("[index][showTargetList]load targetinfo fail", res.data);
        }
      })
  },

  /**
   *  查看图片大图
   */
  previewImageList: function (e) {
    console.info("===>" , e);
    var targetId = e.target.dataset.targetid;
    var picId = e.target.dataset.picid;

    wx.previewImage({
      current: this.data.targetList[targetId].result_pic_list[picId],
      urls: this.data.targetList[targetId].result_pic_list,
    });
  },

  /**
   *  跳到目标结果记录页
   */
  doRecord: function(e) {
    wx.navigateTo({
      url: '../addresult/addresult?targetId='+e.target.dataset.targetid,
    })
  },

/**
 * 删除某个目标
 */
  deleteTarget: function(e) {
    wx.showModal({
      title: '提示',
      content: '确认删除这个目标吗',
      success(res) {
        if (res.confirm) {
          console.log('[index][deleteTarget]use confirm delete target: ', e.target.dataset.targetid);

          // 执行删除
          var timeUtils = require('../utils/timeUtils.js');
          var timeUtil = new timeUtils.TimeUtils();
          const db = wx.cloud.database()
          db.collection('targets').doc(e.target.dataset.targetid).update({
            data: {
              status: 'DELETED',
              gmt_modify_time: timeUtil.getNowTime(),
            },
            success: function (res) {
              console.log('[index][deleteTarget]delete success');
              // 刷新页面
              wx.reLaunch({
                url: './index'
              })
            },
            fail: function (res) {
              console.log('[index][deleteTarget]delete fail');
            }
          })

        } else if (res.cancel) {
          console.log('[index][deleteTarget]use cancle delete target: ', e.target.dataset.targetid);
        }
      }
    })
  },

  onShareAppMessage: function() {
    return {
      title: '来一个可以实现的小目标',
      path: 'pages/index/index'
    }
  }

})
