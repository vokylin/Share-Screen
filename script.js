var devices = {};
var socketIds = {};
var ul = $('#deviceList');
var temp;
var screenWidth = 371, screenHeight = 710;
var client = new Tcp();

function closeSocket(screenWin) {
  for (id in screenWin.contentWindow.socketIds) {
    console.log('close socket:', screenWin.contentWindow.socketIds[id]);
    chrome.sockets.tcp.close(screenWin.contentWindow.socketIds[id], function () {
      if (chrome.runtime.lastError) console.log(chrome.runtime.lastError);

    })
  }
  screenWin.socketIds = {};
}


function createDeviceLi(device, fragment) {
  var li = document.createElement('li');
  var liContnt = '<span>' + device.productName + '</span>' + '<span>' + device.serialNumber + '</span>';
  $(li).attr('id', device.device + device.serialNumber);
  var btn = document.createElement('button');
  btn.innerHTML = 'view';
  $(btn).addClass('btn-warning');
  li.innerHTML = liContnt;
  li.appendChild(btn);
  fragment.appendChild(li);
  setTimeout(function(){
    sendCommands('client', "shell:wm size", device.serialNumber, ()=> {
      socketIds[client.socketId] = device.device + device.serialNumber;
    });
  },3000)
  /*
  * 刚插入手机的时候还需要检测是否有文件，如果没有则安装
  * 安装前需要获取手机的框架，还有sdk版本，再然后推两个文件
  * */

  $(btn).click(function (e) {
    if (!device.SCsize) {
      device.SCsize = '1080x1920';
    }
    sendCommands('client', "shell:LD_LIBRARY_PATH=/data/local/tmp /data/local/tmp/minicap -P " + device.SCsize + "@360x768/0", device.serialNumber, ()=> {
      socketIds[client.socketId] = device.device + device.serialNumber;
    });

    setTimeout(function () {
      sendCommands('client', "shell:/data/local/tmp/minitouch", device.serialNumber, ()=> {
        socketIds[client.socketId] = device.device + device.serialNumber;
      });
    }, 800)

    setTimeout(function(){
      var obj = {
        device : device.device,
        serialNumber : device.serialNumber
      };
      chrome.app.window.create('screen.html', {
        id: JSON.stringify(obj),
        width: screenWidth,
        height: screenHeight,
        maxWidth: screenWidth,
        maxHeight: screenHeight,
        minWidth: screenWidth,
        minHeight: screenHeight,

      }, function (screenWin) {
        screenWin.onClosed.addListener(callback = function () {
          closeSocket(screenWin);
          screenWin.onClosed.removeListener(callback);

        })

      });
    },3000)



    $(e).parents('li').css('backgroundColor', '#ccc').siblings('li').css('backgroundColor', 'none');

  })
}

chrome.sockets.tcp.onReceive.addListener(function (msg) {
  if (socketIds[msg.socketId]) {
    debugger;
    ab2str(msg.data, function (e) {
      debugger;
      console.log('每次的返回值:'+e)
      if (e.startsWith('OKAY')) {
        return null;
      } else if (e.indexOf('Physical size:') != -1) {
        var reg = /([0-9]+)x([0-9]+)/g;
        var tmp = reg.exec(e);
        devices[socketIds[msg.socketId]]['SCsize'] = tmp[0];
      } else if (e.indexOf('Publishing virtual display') != -1) {
        sendCommands('host', "host-serial:" + devices[socketIds[msg.socketId]].serialNumber + ":forward:tcp:" + devices[socketIds[msg.socketId]].capPort + ";localabstract:minicap", devices[socketIds[msg.socketId]].serialNumber, ()=> {
        });
      } else if (e.indexOf('hard-limiting maximum') != -1) {
        sendCommands('host', "host-serial:" + devices[socketIds[msg.socketId]].serialNumber + ":forward:tcp:" + devices[socketIds[msg.socketId]].touchPort + ";localabstract:minitouch", devices[socketIds[msg.socketId]].serialNumber, ()=> {
        });
      }else if(e.indexOf('No such file') != -1&&e.indexOf('minitouch') != -1){
        //console.log('找不到文件')
        sendCommands('client',"shell:getprop ro.product.cpu.abi | tr -d '\r'",devices[socketIds[msg.socketId]].serialNumber,()=>{
          //console.log('查询ABI')
          console.log('ABI'+client.socketId);
          socketIds[client.socketId] = devices[socketIds[msg.socketId]].device+devices[socketIds[msg.socketId]].serialNumber;
          devices[socketIds[msg.socketId]].hasMinitouch = false;
        });

      }else if(e.indexOf('No such file') != -1&&e.indexOf('minicap') != -1&&e.indexOf('minicap.so') == -1){
        //console.log('找不到文件:'+e);
        devices[socketIds[msg.socketId]].hasMinicap = false;
        if(devices[socketIds[msg.socketId]].ABI && devices[socketIds[msg.socketId]].SDK){
          var serial = devices[socketIds[msg.socketId]].serialNumber;
          var url1 = '/file/prebuilt/'+devices[socketIds[msg.socketId]].ABI+'/bin/minicap';
           getData(url1,serial);
          var url2 = '/file/prebuilt/'+devices[socketIds[msg.socketId]].ABI+'/lib/'+devices[socketIds[msg.socketId]].SDK+'/minicap.so';
          getData(url2,serial);
          devices[socketIds[msg.socketId]].hasMinicap = true;
        }else if(devices[socketIds[msg.socketId]].ABI){
          //防止第一次ABI 和 SDK 的返回值分开。导致没有查询成功，minitouch 也没有成功推送
          sendCommands('client',"shell:getprop ro.build.version.sdk | tr -d '\r'",devices[socketIds[msg.socketId]].serialNumber,()=>{
            //console.log('查询SDK')
            console.log('SDK'+client.socketId);
            socketIds[client.socketId] = devices[socketIds[msg.socketId]].device+devices[socketIds[msg.socketId]].serialNumber;
          });
        }else {
          sendCommands('client',"shell:getprop ro.product.cpu.abi | tr -d '\r'",devices[socketIds[msg.socketId]].serialNumber,()=>{
            //console.log('查询ABI')
            console.log('ABI'+client.socketId);
            socketIds[client.socketId] = devices[socketIds[msg.socketId]].device+devices[socketIds[msg.socketId]].serialNumber
          });
        }

      } else if(e.indexOf('No such file') == -1&&e.indexOf('minicap') != -1&&e.indexOf('minicap.so') == -1){
        sendCommands('client',"shell:find /data/local/tmp/minicap.so",devices[socketIds[msg.socketId]].serialNumber,()=>{
          console.log('findMinicapso'+client.socketId);
          socketIds[client.socketId] = devices[socketIds[msg.socketId]].device + devices[socketIds[msg.socketId]].serialNumber;
        });
      }
      else if(e.indexOf('No such file') != -1&&e.indexOf('minicap.so') != -1){
        devices[socketIds[msg.socketId]].hasMinicapso = false;
        if(devices[socketIds[msg.socketId]].ABI && devices[socketIds[msg.socketId]].SDK){
          debugger;
          var serial = devices[socketIds[msg.socketId]].serialNumber;
          var url2 = '/file/prebuilt/'+devices[socketIds[msg.socketId]].ABI+'/lib/'+devices[socketIds[msg.socketId]].SDK+'/minicap.so';
          getData(url2,serial);
          devices[socketIds[msg.socketId]].hasMinicapso = true;
        }else if(devices[socketIds[msg.socketId]].ABI){
          //防止第一次ABI 和 SDK 的返回值分开。导致没有查询成功，minitouch 也没有成功推送
          sendCommands('client',"shell:getprop ro.build.version.sdk | tr -d '\r'",devices[socketIds[msg.socketId]].serialNumber,()=>{
            //console.log('查询SDK')
            console.log('SDK'+client.socketId);
            socketIds[client.socketId] = devices[socketIds[msg.socketId]].device+devices[socketIds[msg.socketId]].serialNumber;
          });
        }else {
          sendCommands('client',"shell:getprop ro.product.cpu.abi | tr -d '\r'",devices[socketIds[msg.socketId]].serialNumber,()=>{
            //console.log('查询ABI')
            console.log('ABI'+client.socketId);
            socketIds[client.socketId] = devices[socketIds[msg.socketId]].device+devices[socketIds[msg.socketId]].serialNumber
          });
        }

      } else if(e.startsWith('arm')){
        //console.log('成功查询ABI:'+e)
        var regRN = /\r\n/g;
        e = e.replace(regRN,"");
        devices[socketIds[msg.socketId]].ABI = e;
        sendCommands('client',"shell:getprop ro.build.version.sdk | tr -d '\r'",devices[socketIds[msg.socketId]].serialNumber,()=>{
          //console.log('查询SDK')
          console.log('SDK'+client.socketId);
          socketIds[client.socketId] = devices[socketIds[msg.socketId]].device+devices[socketIds[msg.socketId]].serialNumber

        });

      }else if(typeof (Number(e)) == 'number'){
        var regRN = /\r\n/g;
        e = e.replace(regRN,"");
        devices[socketIds[msg.socketId]].SDK = e;
        var serial = devices[socketIds[msg.socketId]].serialNumber;
        //开始推文件
        if(devices[socketIds[msg.socketId]].hasMinicap === false&&devices[socketIds[msg.socketId]].hasMinitouch === false){
          //推3个
          var url3 = '/file/minitouch/'+devices[socketIds[msg.socketId]].ABI+'/minitouch';
          getData(url3,serial);
          var url1 = '/file/prebuilt/'+devices[socketIds[msg.socketId]].ABI+'/bin/minicap';
          getData(url1,serial);
          var url2 = '/file/prebuilt/'+devices[socketIds[msg.socketId]].ABI+'/lib/android-'+devices[socketIds[msg.socketId]].SDK+'/minicap.so';
          getData(url2,serial);
          console.log('一次');
          devices[socketIds[msg.socketId]].hasMinitouch = true;
          devices[socketIds[msg.socketId]].hasMinicap = true;
        }else if(devices[socketIds[msg.socketId]].hasMinicap === false){
          debugger;
          console.log('两次')
          var url1 = '/file/prebuilt/'+devices[socketIds[msg.socketId]].ABI+'/bin/minicap';
          getData(url1,serial);
          var url2 = '/file/prebuilt/'+devices[socketIds[msg.socketId]].ABI+'/lib/android-'+devices[socketIds[msg.socketId]].SDK+'/minicap.so';
          getData(url2,serial);
          var url4 = '/file/minirev/'+devices[socketIds[msg.socketId]].ABI+'/minirev';
          getData(url4,serial);
          devices[socketIds[msg.socketId]].hasMinicap = true;
        }
        else if(devices[socketIds[msg.socketId]].hasMinicapso === false&&devices[socketIds[msg.socketId]].hasMinitouch ===false){
          var url3 = '/file/minitouch/'+devices[socketIds[msg.socketId]].ABI+'/minitouch';
          getData(url3,serial);
          var url4 = '/file/minirev/'+devices[socketIds[msg.socketId]].ABI+'/minirev';
          getData(url4,serial);
          var url2 = '/file/prebuilt/'+devices[socketIds[msg.socketId]].ABI+'/lib/android-'+devices[socketIds[msg.socketId]].SDK+'/minicap.so';
          getData(url2,serial)
          console.log('三次')
          devices[socketIds[msg.socketId]].hasMinitouch = true;
          devices[socketIds[msg.socketId]].hasMinicapso = true;
        } else if(devices[socketIds[msg.socketId]].hasMinicapso === false){
          var url2 = '/file/prebuilt/'+devices[socketIds[msg.socketId]].ABI+'/lib/android-'+devices[socketIds[msg.socketId]].SDK+'/minicap.so';
          getData(url2,serial);
          var url4 = '/file/minirev/'+devices[socketIds[msg.socketId]].ABI+'/minirev';
          getData(url4,serial);
          console.log('四次')
          devices[socketIds[msg.socketId]].hasMinicapso = true;
        }
        else if(devices[socketIds[msg.socketId]].hasMinitouch === false){
          var url3 = '/file/minitouch/'+devices[socketIds[msg.socketId]].ABI+'/minitouch';
          getData(url3,serial);
          var url4 = '/file/minirev/'+devices[socketIds[msg.socketId]].ABI+'/minirev';
          getData(url4,serial);
          console.log('五次')
          devices[socketIds[msg.socketId]].hasMinitouch = true;
        }


      }


    });
  }
})

function appendLi(devicesArr) {
  var fragment = document.createDocumentFragment();
  devicesArr.forEach((item)=> {
    if (!devices[item.device + item.serialNumber]) {
      devices[item.device + item.serialNumber] = item;
      devices[item.device + item.serialNumber]['capPort'] = 3131 + item.device;
      devices[item.device + item.serialNumber]['touchPort'] = 1111 + item.device
      createDeviceLi(devices[item.device + item.serialNumber], fragment);
      //检查是否推过文件
      //console.log('查找文件minitouch')
      sendCommands('client',"shell:find /data/local/tmp/minitouch",item.serialNumber,()=>{
        console.log('findMinitouch'+client.socketId);
        socketIds[client.socketId] = item.device + item.serialNumber;
      });
      /*setTimeout(function () {
        sendCommands('client',"shell:find /data/local/tmp/minicap",item.serialNumber,()=>{
          console.log('findMinicap'+client.socketId);
          socketIds[client.socketId] = item.device + item.serialNumber;
        });
      },1000);*/

    } else {
      $('#' + item.device + item.serialNumber).css('background-color', '#ccc')
    }

  });
  ul.append(fragment);

}


$('#mat_findDevice').click(() => {
  chrome.usb.getUserSelectedDevices({
    'multiple': false,
    filters: [{interfaceClass: 255, interfaceSubclass: 66, interfaceProtocol: 1}]
  }, function (devicesArr) {
    appendLi(devicesArr)

  });
});


chrome.usb.getDevices({}, (devicesArr)=> {
  if (chrome.runtime.lastError != undefined) {
    console.warn('chrome.usb.getDevices error: ' +
      chrome.runtime.lastError.message);
    return;
  }
  temp = devicesArr;
  if (devicesArr.length != 0) {
    appendLi(devicesArr)
  }
});

if (chrome.usb.onDeviceAdded) {
  chrome.usb.onDeviceAdded.addListener(function (device) {
    var arr = [];
    arr.push(device);
    appendLi(arr);
    devices[device.device + device.serialNumber] = device;
  });
}

if (chrome.usb.onDeviceRemoved) {
  chrome.usb.onDeviceRemoved.addListener(function (device) {
    delete devices[device.device + device.serialNumber];
    var lis = ul.find('li');
    lis.remove('#' + device.device + device.serialNumber);
  });
}


