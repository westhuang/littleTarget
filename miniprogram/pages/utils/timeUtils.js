/**
 * 时间工具类
 */
class TimeUtils {

/**
  * 获取当前时间，YYYY-MM-DD HH:MM:SS格式
  */
  getNowTime = function () {
    var date = new Date();
    //年
    var Y = date.getFullYear();
    //月
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
    //日
    var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    //时
    var h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    //分
    var m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    //秒
    var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();

    return ("" + Y + "-" + M + "-" + D + " " + h + ":" + m + ":" + s);
  }

  /**
    * 获取当前时间，YYYY-MM-DD格式
    */
  getNowBrifTime = function () {
    var date = new Date();
    //年
    var Y = date.getFullYear();
    //月
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
    //日
    var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();

    return ("" + Y + "-" + M + "-" + D);
  }

/**
 * 获取当前时间，unix时间格式
 */
  getUnixNowTime = function () {
    return Date.parse(new Date());
  }
}

module.exports = {
  TimeUtils: TimeUtils
}
