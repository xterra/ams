

module.exports = {
  getGroupUrlFromUrl
}

function getGroupUrlFromUrl(clientUrl) {
  let requestedURL = decodeURI(clientUrl);
  let delimeteredURL = requestedURL.split('/');
  return delimeteredURL[delimeteredURL.length - 2];
}
