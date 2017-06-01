# SS(Share Screen)
## 基于ADB开发,沿用STF项目的minicap和minitouch工具,实现Android手机屏幕共享及远程控制的一款chrome app.
# 使用方式
1. 下载并安装此应用到chrome的扩展程序中
2. 启动adb,打开命令行输入
   `adb start-server`
3. Android手机开启开发者选项，用数据线连接Android手机和PC
4. 手机弹出是否允许USB调试,选择确定
5. 打开应用,点击“Find devices”按钮,选择已连接的设备
6. 此时应用的列表里会出现已选择的Android手机,等待几秒钟,按钮从“preparing”变成“view”即可正常使用
7. 点击“view”弹出窗口,就实现手机屏幕共享到PC啦


# 需要的环境或工具
* chrome浏览器(最好更新到新版)
* 安装ADB

## tips
此应用可以用于同时共享多个Android手机屏幕,只需要第一个设备启动正常的情况下,用数据连接其余设备即可.






