function loadCSS(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve(href);
    link.onerror = () => reject(`Failed to load: ${href}`);
    document.head.appendChild(link);
  });
}

function loadCSSFiles(cssFiles) {
  return Promise.allSettled(cssFiles.map(loadCSS)).then(results => {
      const failedLoads = results.filter(r => r.status === 'rejected').map(r => r.reason);
      if(failedLoads.length != 0) {
        throw "Failed to load the following CSS files:", failedLoads.toString();
      } 
  });
}

window.loadCSSFiles = loadCSSFiles;

