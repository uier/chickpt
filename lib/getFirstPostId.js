const { postRequest } = require('./request');
const getToken = require('./getToken');
require('dotenv').config();

module.exports = async () => {
  const { csrfToken, cookie } = await getToken(process.env.TARGET_URL);
  const josListURL = 'https://www.chickpt.com.tw/ajax/case';
  const resp = await postRequest({
    url: josListURL,
    headers: {
      'X-CSRF-TOKEN': csrfToken,
      Cookie: cookie,
    },
    json: true,
  });
  if (resp.statusCode !== 200) {
    const err = new Error(`Token 可能過期了，目前 StatusCode: ${resp.statusCode}`);
    throw err;
  }
  console.log(resp.body.jobs[0].id);
  return resp.body.jobs[0].id;
};
