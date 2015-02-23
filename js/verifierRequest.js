chrome.runtime.getBackgroundPage(function(bgPage){
    var location = window.location.href;

    if(location.indexOf('request') !== -1){
        window.location.href = bgPage.oDesk.verifierRedirectURL();
    } else {
        bgPage.oDesk.verifierRequestDone(window.location.search);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.remove(tabs[0].id);
        });
    }
});