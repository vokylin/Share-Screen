function ab2str(buf,callback){
  var b = new Blob([new Uint8Array(buf)]);
  var f = new FileReader();
  f.onload = function (e) {
    callback(e.target.result);
  };
  f.readAsText(b);
}
function str2ab(oldStr, newAB, end) {
  //console.log(oldStr);
  //var sTemp = str2ab(str[s], null, false);
  oldStr = unescape(encodeURIComponent(oldStr));
  var o = oldStr.length;
  if (end) o++;
  if (!newAB) {
    newAB = new ArrayBuffer(o)
  }
  var i = new Uint8Array(newAB);
  if (end) i[oldStr.length] = 0;
  for (var r = 0,
         s = oldStr.length; r < s; r++) {
    i[r] = oldStr.charCodeAt(r)
  }
  return newAB
}
function makeCommand(cmd) {
  var hex = cmd.length.toString(16);
  while (hex.length < 4) {
    hex = "0" + hex;
  }
  cmd = hex + cmd;

  return cmd;
}
var counter = 0;
function sendCommands(type,cmd,serial,callback){
  // sockets['tcp5037'] && client.close(()=>{});关闭sockets
  if(++counter%10 == 0){
    client.getSockets((e)=>{
      e.forEach(function(value){
        chrome.sockets.tcp.close(value.socketId,()=>{})
      })
    })
  }
  client.init(function(){
    client.connect(function () {
      //exeCommands(cmd,serial,callback)
      if (type == 'host'){
        //服务端命令直接运行
        client.send(str2ab(makeCommand(cmd)),()=>{
          callback()
          sockets['tcp5037'] = client.socketId;
        })
      } else if (type == 'client'){
        //客户端命令，需要先链接客户端
        var conDevice = 'host:transport:' + serial
        client.send(str2ab(makeCommand(conDevice)),function(){
          client.send(str2ab(makeCommand(cmd)),()=>{
            callback();
            sockets['tcp5037'] = client.socketId;
          })
        })
      }
    })
  })
}