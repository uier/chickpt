const { getRequest } = require('./request');

module.exports = async (targetUrl) => {
  const regExp = new RegExp('<meta name="csrf-token" content="([A-Za-z0-9]*)">', 'gi');
  const response = await getRequest({
    url: targetUrl,
    json: true,
  });
  const csrfToken = regExp.exec(response.body)[1];
  const cookie = response.headers['set-cookie'];
  return { csrfToken, cookie };
};
