var element = document.createElement('script');
// @ts-ignore
element.src = chrome.runtime.getURL('dist/src/auto-clicker.js');
document.body.appendChild(element);
