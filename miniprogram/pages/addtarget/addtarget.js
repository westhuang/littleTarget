// miniprogram/pages/addtarget/addtarget.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isopen: false,
  },

 /**
  * 获取开关值 
  */
  swithChange: function (e) {
    this.setData ({
      isopen: e.detail.value,      
    })
  },

  /**
   * 提交表单
   */
  formSubmit: function (e) {
    console.log('[addtarget][formSubmit] target: ', e.detail.value);

    // 获取用户信息
    if ('{}' == JSON.stringify(app.globalData.userInfo)) {
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              success: res => {
                console.log('[addtarget][getuserinfo] res: ', res);
                app.globalData.userInfo = res.userInfo;

                // 记录目标信息到db
                this.addTargetToDb(e.detail.value);
              }
            })
          } else {
            console.log('[addtarget][getuserinfo]user not auth, need auth');
            wx.openSetting({
              success(res) {
                console.log(res.authSetting)
              }
            })
          }
        }
      })
    } else {
      // 记录目标信息到db
      this.addTargetToDb(e.detail.value);
    }
  },

  addTargetToDb: function (targetContentInfo) {
    // 获取表单数据，不能为空
    if ("" == targetContentInfo.targetContent) {
      wx.showToast({
        title: '目标哪能为空呢~',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 准备目标数据，写入db
    var timeUtils = require('../utils/timeUtils.js');
    var timeUtil = new timeUtils.TimeUtils();

    const db = wx.cloud.database()
    db.collection('targets').add({
      data: {
        openid: app.globalData.userOpenid,
        nickname: app.globalData.userInfo.nickName,
        avatar_url: app.globalData.userInfo.avatarUrl,
        target_name: targetContentInfo.targetName,
        target_content: targetContentInfo.targetContent,
        isopen: this.data.isopen,
        status: "ING", // ING, DONE, DELETED
        begin_time: timeUtil.getNowBrifTime(),
        gmt_create_time: timeUtil.getNowTime(),
        gmt_modify_time: timeUtil.getNowTime(),
      },
      success: res => {
        wx.showToast({
          icon: 'success',
          title: '发布成功',
        })
        console.log('[addtarget][addTargetToDb] success，_id: ', res._id)

        // 跳转到首页
        wx.reLaunch({
          url: '../index/index'
        })
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '发布失败',
        })
        console.error('[addtarget][addTargetToDb] fail', err)
      }
    })
  },

  onShareAppMessage: function () {
    return {
      title: '来一个可以实现的小目标',
      path: 'pages/index/index'
    }
  }
  
})