
var devices = {};
var socketIds = {};
var ul = $('#deviceList');
var temp;
var tmpRes = '',tmpDevices = '';
var screenWidth = 371, screenHeight = 710;
var client = new Tcp();
var tips = "请先启动adb服务，再使用此应用:run '$adb start-server'";
throwTip(tips,'info');
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
  var liContnt = "<span class='col-xs-3 "+(device.productName?"text-danger":"") +"'>" + (device.productName||"无法获取") + '</span>' + "<span class='col-xs-5 "+(device.productName?"text-danger":"")+"'>" + (device.serialNumber||"无法获取") + '</span>';
    $(li).attr('id', device.device + device.serialNumber);
    $(li).addClass('row')
    var btn = document.createElement('button');
    btn.innerHTML = 'preparing';
    $(btn).addClass('btn btn-warning col-xs-2 col-xs-offset-1');
     $(btn).attr('disabled','disabled');
    li.innerHTML = liContnt;
    li.appendChild(btn);
    fragment.appendChild(li);
    setTimeout(function(){
        sendCommands('client', "shell:wm size", device.serialNumber, ()=> {
            socketIds[client.socketId] = device.device + device.serialNumber;
        });
    },2000)
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
function appendLi(devicesArr) {
    var fragment = document.createDocumentFragment();
    devicesArr.forEach((item,index)=> {
        if (!devices[item.device + item.serialNumber]) {
            devices[item.device + item.serialNumber] = item;
            devices[item.device + item.serialNumber]['capPort'] = 3131 + item.device;
            devices[item.device + item.serialNumber]['touchPort'] = 1111 + item.device
            createDeviceLi(devices[item.device + item.serialNumber], fragment);

            //检查ABI
            console.log('这次手机的serial:'+item.serialNumber);
                sendCommands('client',"shell:getprop ro.product.cpu.abi | tr -d '\r'",item.serialNumber,()=>{
                    console.log('ABI'+client.socketId);
                    socketIds['searchId'] = client.socketId;
                    socketIds[client.socketId] = item.device+item.serialNumber;
                    var t1 = setTimeout(()=>{
                        if(tmpRes.startsWith('arm')||tmpRes.startsWith('x86')){
                            var regRN = /\r\n/g;
                            tmpRes = tmpRes.replace(regRN,"");
                            devices[item.device+item.serialNumber].ABI = tmpRes;
                            sendCommands('client',"shell:getprop ro.build.version.sdk | tr -d '\r'",item.serialNumber,()=>{
                                socketIds['searchId'] = client.socketId;
                                console.log('SDK'+client.socketId);
                                socketIds[client.socketId] = item.device+item.serialNumber;
                                var t2 = setTimeout(()=>{
                                    if(!isNaN(tmpRes)){
                                        var regRN = /\r\n/g;
                                        tmpRes = tmpRes.replace(regRN,"");
                                        devices[item.device+item.serialNumber].SDK = tmpRes;
                                        var serial = item.serialNumber;
                                        //开始推文件
                                        var url3 = '/file/minitouch/'+devices[item.device+item.serialNumber].ABI+'/minitouch';
                                        getData(url3,serial);
                                        var url1 = '/file/prebuilt/'+devices[item.device+item.serialNumber].ABI+'/bin/minicap';
                                        getData(url1,serial);
                                        var url2 = '/file/prebuilt/'+devices[item.device+item.serialNumber].ABI+'/lib/android-'+devices[item.device+item.serialNumber].SDK+'/minicap.so';
                                        getData(url2,serial);
                                        var url4 = '/file/minirev/'+devices[item.device+item.serialNumber].ABI+'/minirev';
                                        getData(url4,serial);

                                    }
                                    clearTimeout(t2);
                                    tmpRes = '';
                                },2000)

                            });

                        }
                        clearTimeout(t1);
                        tmpRes = '';
                    },3000)
                });

        } else {
            $('#' + item.device + item.serialNumber).css('background-color', '#ccc')
        }

    });
    ul.append(fragment);
}

//发送 adb devices 查询设备状态是否可用
function adbDevices(devicesArr) {
    sendCommands('host',"host:devices",null,()=>{
        //console.log('查询SDK')
        console.log('devices-l:'+client.socketId);
        socketIds['findDevice'] = client.socketId;
        socketIds[client.socketId] = client.socketId
            var t3 = setTimeout(function () {
                console.log('tmpDevices:'+tmpDevices);
                var arr = tmpDevices.split('\n');
                debugger;
                console.log('开始查询状态')
                for(var i=0;i<arr.length;i++){
                    console.log('进入循环')
                    if(arr[i].indexOf(devicesArr[0].serialNumber)!=-1){
                        if(arr[i].indexOf('device') !=-1){
                            console.log('状态可用')
                            //状态可用
                            //设置定时器 6s之后检查是否文件推送完成
                            appendLi(devicesArr);
                            setTimeout(function () {
//改变按钮
                                $('#'+devicesArr[0].device+devicesArr[0].serialNumber).find('button').html('view').removeAttr('disabled').removeClass('btn-warning').addClass('btn-success')

                            },6000);

                        }else if(arr[i].indexOf('unauthorized') !=-1){
                            console.log('没授权')
                            //设置定时器 6s之后检查是否文件推送完成
                            var opt = {
                                type: "basic",
                                iconUrl: '/assets/ic_android_pressed.png',
                                title: '请允许手机调试',
                                message:"请点击允许USB调试,再尝试点击find devices...",
                            }
                            chrome.notifications.create(opt,()=>{})

                        }else if(arr[i].indexOf('offline') !=-1){
                            console.log('状态离线')
                            //设置定时器 6s之后检查是否文件推送完成
                            var opt = {
                                type: "basic",
                                iconUrl: '/assets/ic_android_pressed.png',
                                title: '手机状态不可用',
                                message:"adb检查手机状态为offline, 请检查是否已经允许USB调试或重启手机",
                            }
                            chrome.notifications.create(opt,()=>{})
                        }
                        break;
                    }
                }
                if(i==arr.length){
                    console.log('找不到手机')
                    var opt = {
                        type: "basic",
                        iconUrl: '/assets/ic_android_pressed.png',
                        title: '手机不可用',
                        message:"adb无法正常连接手机，请检查驱动是否安装成功",
                    }
                    chrome.notifications.create(opt,()=>{})
                }
                tmpDevices = '';
                clearTimeout(t3);

            },1500)
    });
}
$('#mat_findDevice').click(() => {
    chrome.usb.getUserSelectedDevices({
        'multiple': false,
        filters: [{interfaceClass: 255, interfaceSubclass: 66, interfaceProtocol: 1}]
    }, function (devicesArr) {
        console.log(devicesArr);
        if(devicesArr.length >0){
            adbDevices(devicesArr)
        }

    });

});

/*

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
*/
if (chrome.usb.onDeviceRemoved) {
    chrome.usb.onDeviceRemoved.addListener(function (device) {
        delete devices[device.device + device.serialNumber];
        var lis = ul.find('li');
        lis.remove('#' + device.device + device.serialNumber);
    });
}
chrome.sockets.tcp.onReceive.addListener(function (msg) {
    if (socketIds[msg.socketId]) {
        debugger;
        ab2str(msg.data, function (e) {
            if(socketIds['searchId'] &&msg.socketId == socketIds['searchId']){
                debugger;
                e = e.trim();
                if(e != 'OKAY'){
                    tmpRes = tmpRes+e;
                }
            }else if(socketIds['findDevice'] &&msg.socketId == socketIds['findDevice']){
                e = e.trim();
                console.log(msg.socketId+':::::'+e);
                if(e != 'OKAY'){
                    tmpDevices = tmpDevices+e;
                }
            }
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
            }
        });
    }
});


