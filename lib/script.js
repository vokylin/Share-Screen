var client = new tcp();




//shell getprop ro.product.cpu.abi | tr -d '\r'
//shell getprop ro.build.version.sdk | tr -d '\r'
//187多任务   3主页  4返回      26锁屏
document.getElementById('add-device').addEventListener('click',function(){
  sendCommands('client',"shell:input keyevent 24",'RO5PBM5LQWJZDQCM',()=>{

  });
})
var sockets = {};

chrome.sockets.tcp.onReceive.addListener(function (info) {
  if (info.socketId == sockets['tcp5037']) {
    ab2str(info.data,function (e) {
      if(!e.startsWith('OKAY')){
        socketReceive(e);
      }
    });
  }
});
chrome.sockets.tcp.onReceiveError.addListener(function (info) {
  if (info.socketId == sockets['tcp5037']) {
    console.error(info);
  }
});
function socketReceive(e){
  console.log('receive:'+e)
  // 这里准备推送文件
  // if(e == 'arm64-v8a'){
  //   sendCommands("getprop ro.build.version.sdk | tr -d '\r'",'RO5PBM5LQWJZDQCM',()=>{})
  // } else if (!isNaN(e)){
  //   sendCommands('')
  // }
}
