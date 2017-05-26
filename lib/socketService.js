var host = "127.0.0.1";
var port = 5037;
function create() {
    var defer = $.Deferred();
    chrome.socket.create("tcp", {}, function (createInfo) {
        if (createInfo.socketId >= 0) {

                defer.resolve(createInfo);
        } else {
            // console.log("create error:", createInfo);
        }
    });

    return defer.promise();
}

function connect(createInfo, host, port) {
    var defer = $.Deferred();

    if (typeof(port) != "number") {
        port = parseInt(port, 10);
    }

    chrome.socket.connect(createInfo.socketId, host, port, function (result) {
        if (result >= 0) {
                defer.resolve(createInfo);
        } else {
            chrome.socket.destroy(createInfo.socketId);
            defer.reject(createInfo);
        }
    });

    return defer.promise();
}

function write(createInfo, str,n) {
    var defer = $.Deferred();

    stringToArrayBuffer(str, function (bytes) {
        writeBytes(createInfo, bytes)
            .then(function (createInfo) {
                if(n){
                    read(createInfo.createInfo, 4);
                }
                defer.resolve(createInfo);
            });
    });

    return defer.promise();
}

function writeBytes(createInfo, bytes) {
    var defer = $.Deferred();

    chrome.socket.write(createInfo.socketId, bytes, function (writeInfo) {
        // console.log("writeInfo:", writeInfo);
        if (writeInfo.bytesWritten > 0) {
                var param = {
                    createInfo: createInfo,
                    writeInfo: writeInfo
                };
                defer.resolve(param);

        } else {
            // console.log("write error:", arrayBuffer);
            defer.reject(writeInfo);
        }
    });

    return defer.promise();
}

function read(createInfo, size) {
    var defer = $.Deferred();

    chrome.socket.read(createInfo.socketId, size, function (readInfo) {
        if (readInfo.resultCode > 0) {
            // console.log(readInfo);
            arrayBufferToString(readInfo.data, function (str) {
                    var param = {
                        createInfo: createInfo,
                        data: str
                    };
                    defer.resolve(param);

            });
        } else {
            defer.reject(readInfo);
        }
    });

    return defer.promise();
}

function stringToArrayBuffer(str, callback) {
    var b = new Blob([str]);
    var f = new FileReader();
    f.onload = function (e) {
        callback(e.target.result);
    };
    f.readAsArrayBuffer(b);
}
function arrayBufferToString(buf, callback) {
    var b = new Blob([new Uint8Array(buf)]);
    var f = new FileReader();
    f.onload = function (e) {
        callback(e.target.result);
    };
    f.readAsText(b);
}
function getNewCommandPromise (cmd) {
    return create()
        .then(function (createInfo) {
            return connect(createInfo, host, port);
        })
        .then(function (createInfo) {
            var cmdWidthLength = makeCommand(cmd);
            // console.log("command:", cmdWidthLength);
            return write(createInfo, cmdWidthLength);
        })
        .then(function (param) {
            return read(param.createInfo, 4);
        })
        .catch(function (param) {
            console.log('error2:'+param)
        });
}

function getCommandPromise (cmd, createInfo) {
    var cmdWidthLength = makeCommand(cmd);
    return write(createInfo, cmdWidthLength)
        .then(function (param) {
            return read(param.createInfo, 1024);
        });
}



