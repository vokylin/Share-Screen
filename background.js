chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    innerBounds: {
      width: 670,
      height: 550,
      minWidth: 670,
      minHeight: 550
    },
    id: "ChromeApps-Sample-USB-DeviceInfo"
  });
});

