var element = document.createElement('script');
// @ts-ignore
element.src = chrome.runtime.getURL('auto-clicker.js');
document.body.appendChild(element);
