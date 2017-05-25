function Tcp() {
  var _tcp = chrome.sockets.tcp;
  this.address = '127.0.0.1';
  this.port = 5037;
  this.option = {
    persistent: false,
    bufferSize: 8192
  },
  this.socketId = 0,

  this.create = function (callback) {
    _tcp.create(this.option, function (socketInfo) {
      this.socketId = socketInfo.socketId;
      callback(socketInfo);
    }.bind(this));
  }.bind(this),

  this.update = function () {
    _tcp.update(this.socketId, newSocketOption, callback);
  }.bind(this),

  this.pause = function (isPaused, callback) {
    _tcp.setPaused(this.socketId, isPaused, callback);
  }.bind(this),

  this.keepAlive = function (enable, delay, callback) {
    _tcp.setKeepAlive(this.socketId, enable, delay, function (code) {
      if (code < 0) {
        this.error(code);
      }
      else {
        callback();
      }
    }.bind(this));
  }.bind(this),

  this.noDelay = function (noDelay, callback) {
    _tcp.setNoDelay(this.socketId, noDelay, function (code) {
      if (code < 0) {
        this.error(code);
      }
      else {
        callback();
      }
    }.bind(this));
  }.bind(this),

  this.disconnect = function (callback) {
    _tcp.disconnect(this.socketId, callback);
  }.bind(this),

  this.close = function (callback) {
    _tcp.close(this.socketId, callback);
  }.bind(this),

  this.error = function (code) {
    console.log('An error occurred with code ' + code);
  },

  this.init = function (callback) {
    this.create(callback);
  }.bind(this)
  this.connect = function (callback) {
    _tcp.connect(this.socketId, this.address, this.port, function (e) {
      // this.pause(false,()=>{});
      // this.noDelay(false,()=>{});
      callback();
    }.bind(this));
  }.bind(this),
  this.send = function (data, callback) {
    _tcp.send(this.socketId, data, callback);
  }.bind(this),

  this.getInfo = function(callback){
    _tcp.getInfo(this.socketId, callback);
  }.bind(this),

  this.getSockets = function(callback){
    _tcp.getSockets (callback);
  }.bind(this)
}
var counter = 0;
function sendCommands(type,cmd,serial,callback){
  //性能优化考虑
  if(++counter%10 == 0){
    client.getSockets((e)=>{
      e.forEach(function(value){
        !value.peerPort && chrome.sockets.tcp.close(value.socketId,()=>{})
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
          socketIds['tcp5037'] = client.socketId;
        })
      } else if (type == 'client'){
        //客户端命令，需要先链接客户端
        var conDevice = 'host:transport:' + serial
        client.send(str2ab(makeCommand(conDevice)),function(){
          client.send(str2ab(makeCommand(cmd)),()=>{
            callback();
            socketIds['tcp5037'] = client.socketId;
          })
        })
      }
    })
  })
}

function str2ab(oldStr, newAB, end) {
  //console.log(oldStr);
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
function ab2str(buf,callback){
  var b = new Blob([new Uint8Array(buf)]);
  var f = new FileReader();
  f.onload = function (e) {
    callback(e.target.result);
  };
  f.readAsText(b);
}
function makeCommand(cmd) {
  var hex = cmd.length.toString(16);
  while (hex.length < 4) {
    hex = "0" + hex;
  }
  cmd = hex + cmd;

  return cmd;
}
function throwTip(tips,type){
  tips = tips||'无初始tips';
  type = type || 'danger';
  var tmpl = `<div class="row alert alert-`+type+` alert-dismissible" role="alert">
      <div class="col-xs-2">
        <strong>tips!</strong>
      </div>
      <div class="col-xs-9">
        <span>`+tips+`</span>
      </div>
      <div class="col-xs-1">
        <button type="button" class="close" data-dismiss="alert"><span>&times;</span></button>
      </div>
    </div>`;
  $('.container').before(tmpl);
}