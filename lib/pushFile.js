//用的API: chrome.socket

function integerToArrayBuffer(value) {
    var result = new Uint32Array(1);
    result[0] = value;
    return result;
}
function choose() {
    chrome.fileSystem.chooseEntry({'type': 'openFile'}, function (entry, fileEntries) {
        chrome.fileSystem.getDisplayPath(entry, function (displayPath) {
            pushFile('O7NJTKGU55TSOVFY', entry, displayPath);
        });
    });
};

function pushFile(serial, fileEntry, filePath) {
    debugger;
    fileEntry.file(function (file) {
        var reader = new FileReader();
        reader.onloadend = function (e) {
            if (!e.target.error) {
                pushFileCommands(e, serial, filePath);
            }
        };
        reader.readAsArrayBuffer(file);
    });
};
$('#mat_chooseFile').click(function () {
    choose();
})

function pushFileCommands(e, serial, filePath) {
    console.log('推文件啦：'+filePath);
    var fileName = filePath.replace(/^.*[\\\/]/, '');
    var cmd1 = 'host:transport:' + serial;
    var cmd2 = 'sync:';
    var sendCmd1 = 'SEND';
    var packagePath = '/data/local/tmp/' + fileName;
    var sendCmd3 = packagePath + ',53206';
    var sendCmd2 = integerToArrayBuffer(sendCmd3.length);
    var dataCmd1 = 'DATA';
    var doneCmd = 'DONE';
   getNewCommandPromise(cmd1)
        .then(function (param) {
            if (param.data == "OKAY") {
                return getCommandPromise(cmd2, param.createInfo);
            }
        })
        .then(function (param) {
            if (param.data == "OKAY") {
                //return $scope.getCommandPromise(sendCmd1, param.createInfo);

                return write(param.createInfo, sendCmd1,1);
            }
        })
        .then(function (param) {
            return writeBytes(param.createInfo, sendCmd2.buffer);
        })
        .then(function (param) {
            return write(param.createInfo, sendCmd3);
        })
        .then(function (param) {
            var defer = $.Deferred();
            var promise = defer;
            var file = e.target.result;
            //var file = e;
            var maxChunkSize = 64 * 1024;
            for (var i = 0; i < file.byteLength; i += maxChunkSize) {
                var chunkSize = maxChunkSize;
                //check if on last chunk
                if (i + maxChunkSize > file.byteLength) {
                    chunkSize = file.byteLength - i;
                }

                var chunkFunc = function (i, chunkSize) {
                    console.log(111);
                    var fileSlice = file.slice(i, i + chunkSize);
                    promise = promise.then(function (param) {
                        return write(param.createInfo, dataCmd1);
                    })
                        .then(function (param) {
                            var chunkSizeInBytes = integerToArrayBuffer(chunkSize);
                            return writeBytes(param.createInfo, chunkSizeInBytes.buffer);
                        })
                        .then(function (param) {
                            return writeBytes(param.createInfo, fileSlice);
                        });
                };
                chunkFunc(i, chunkSize);
            }

            promise.then(function (param) {
                return write(param.createInfo, doneCmd);
            })
                .then(function (param) {
                    return write(param.createInfo, integerToArrayBuffer(0));
                })



            defer.resolve(param);

            return promise;
        })
        .catch(function (param) {
            console.log('error1:'+param)

        });

};
function getData(url,serial) {
    $.ajax({
        url:url,
        type:'get',
        dataType: 'blob'
    })
        .done(function (data) {
            var reader = new FileReader();
            reader.onloadend = function (e) {
                if (!e.target.error) {
                    pushFileCommands(e,serial,url)
                }
            };
            reader.readAsArrayBuffer(data);

        })
        .fail(function (e) {
            console.log(e)
        })
}



