// miniprogram/pages/addresult/addresult.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    targetId: '',

    resultContent: '',
    cloudPicList: [],
    cloudFilmSrc: '',

    tmpPicList: [],
    maxPicNum: 9,
    leftMaxPicNum: 9,
    isMaxPicNum: false,

    tmpFilmSrc: '',
    isChoosedFilm: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      targetId: options.targetId
    })
    console.info("[addresult][onLoad]==>", this.data.targetId);
  },

  /**
   * 选择图片准备上传
   */
  chooseImg: function () {
    wx.chooseImage({
      count: this.data.leftMaxPicNum,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: chooseResult => {
        const tempPicPaths = chooseResult.tempFilePaths
        var newPicList = this.data.tmpPicList.concat(tempPicPaths)
        var leftPicNum = this.data.maxPicNum - newPicList.length

        this.setData({
          tmpPicList: newPicList,
          leftMaxPicNum: leftPicNum,
        })
        if (0 == this.data.leftMaxPicNum) {
          this.setData({
            isMaxPicNum: true,
          })
        }
      }
    })
  },

  /**
   * 查看图片大图
   */
  previewImageList: function (e) {
    wx.previewImage({
      current: this.data.tmpPicList[e.target.dataset.picid],
      urls: this.data.tmpPicList,
    })
  },

  /**
   * 选择视频准备上传
   */
  chooseFilm: function () {
    wx.chooseVideo({
      sizeType: ['original', 'compressed'],
      maxDuration: 60,
      sourceType: ['album', 'camera'],
      success: chooseResult => {
        this.setData({
          tmpFilmSrc: chooseResult.tempFilePath,
          isChoosedFilm: true,
        })
      }
    })
  },

  /**
   * 提交表单
   */
  formSubmit: function (e) {
    // 获取提交数据，不能为空
    console.log('[addresult][formSubmit]data：', e.detail.value);
    if ("" == e.detail.value.resultContent &&
      0 == this.data.tmpPicList.length &&
      "" == this.data.tmpFilmSrc) {
      wx.showToast({
        title: '文字图片视频，总得记点啥吧~',
        icon: 'none',
        duration: 2000
      })
      return;
    }

    wx.showLoading({
      title: '发布中',
    })

    this.setData({
      resultContent: e.detail.value.resultContent,
    })

    // 数据记录db
    // 有图片或视频时，先上传文件，然后存db
    if (this.data.tmpPicList.length > 0 || this.data.tmpFilmSrc != '') {
      this.uploadPicListAndThenFilm(); // 先上传图片，图片完成后再上传视频
    }
    // 无图片和视频时，直接写db
    else {
      this.updateTargetToDb();
    }
  },

  /**
   * 先上传图片，图片完成后再上传视频
   */
  uploadPicListAndThenFilm: function() {

    var timeUtils = require('../utils/timeUtils.js');
    var timeUtil = new timeUtils.TimeUtils();

    // 图片有则先上次图片，上次完成后传视频
    if (this.data.tmpPicList.length > 0) {
      var cloudPicIdList = []
      var doneCnt = 0
      for (var i = 0; i < this.data.tmpPicList.length; i++) {
        var picCloudPath = 'targets/pictures/' + app.globalData.userOpenid + '-' + timeUtil.getUnixNowTime() + '-' + i
        wx.cloud.uploadFile({
          cloudPath: picCloudPath,
          filePath: this.data.tmpPicList[i],
          success: res => {
            console.log('[addresult][uploadPicListAndThenFilm]upload success one: ', res);
            cloudPicIdList = cloudPicIdList.concat(res.fileID);
            ++doneCnt;
          },
          fail: res => {
            console.log('[addresult][uploadPicListAndThenFilm]upload fail one: ', res)
          },
          complete: () => {
            console.log('[addresult][uploadPicListAndThenFilm]upload complete: ', doneCnt);

            // 然后传视频
            if (doneCnt == this.data.maxPicNum - this.data.leftMaxPicNum) {
              this.setData({
                cloudPicList: cloudPicIdList
              });

              this.uploadFilm();
            }
          }
        })
      }
    }
    // 图片无则直接上次视频，完成后记db
    else {
      this.uploadFilm();
    }
  },


/**
 * 上传视频文件，完成后记录db
 */
  uploadFilm: function() {

    var timeUtils = require('../utils/timeUtils.js');
    var timeUtil = new timeUtils.TimeUtils();

    // 有选择视频，先上传视频再记录db
    if (this.data.tmpFilmSrc != '') {
      var filmCloudPath = 'targets/films/' + app.globalData.userOpenid + '-' + timeUtil.getUnixNowTime();

      wx.cloud.uploadFile({
        cloudPath: filmCloudPath,
        filePath: this.data.tmpFilmSrc,
        success: res => {
          console.log('[addresult][uploadFilm]upload success: ', res);
          this.setData({
            cloudFilmSrc: res.fileID
          })
          // 然后记db
          this.updateTargetToDb();
        },
        fail: res => {
          console.log('[addresult][uploadFilm]upload fail: ', res);
          wx.showToast({
            title: '发布失败，请重试',
            icon: 'none',
            duration: 2000
          });
          return;
        }
      })
    }
    // 未选择视频，直接存db
    else {
      this.updateTargetToDb();
    }
  },

/**
 * 记录db
 */
  updateTargetToDb: function() {

    var timeUtils = require('../utils/timeUtils.js');
    var timeUtil = new timeUtils.TimeUtils();

    const db = wx.cloud.database()
    db.collection('targets').doc(this.data.targetId).update({
      data: {
        result_content: this.data.resultContent,
        result_pic_list: this.data.cloudPicList,
        result_film: this.data.cloudFilmSrc,
        status: 'DONE',
        gmt_modify_time: timeUtil.getNowTime(),
      },
      success: function (res) {
        wx.showToast({
          icon: 'success',
          title: '发布成功',
        })
        console.log('[addresult][updateTargetToDb]update success: ', res);
        // 刷新页面
        wx.reLaunch({
          url: '../index/index'
        })
      },
      fail: function (res) {
        wx.showToast({
          title: '发布失败，请重试',
          icon: 'none',
          duration: 2000
        });
        console.log('[addresult][updateTargetToDb]update fail: ', res);
      }
    })

    wx.hideLoading();
  },

  onShareAppMessage: function () {
    return {
      title: '来一个可以实现的小目标',
      path: 'pages/index/index'
    }
  }
})