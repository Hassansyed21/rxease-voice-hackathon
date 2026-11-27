export default {
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'rxease.store' && url.protocol === 'http:') {
      url.protocol = 'https:';
      return Response.redirect(url, 308);
    }
    return env.ASSETS.fetch(request);
  }
};
