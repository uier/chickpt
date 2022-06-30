require('dotenv').config();

const { postRequest } = require('./lib/request');
const sendLineNotify = require('./lib/sendLineNotify');
const getFirstPostId = require('./lib/getFirstPostId');
const getToken = require('./lib/getToken');

let stopIntervalId;
let countFail = 0;
const keywords = process.env.KEYWORDS ? process.env.KEYWORDS.split(',') : [];
(async () => {
  let originPostId = await getFirstPostId();
  stopIntervalId = setInterval(async () => {
    try {
      console.log(`${new Date()}: '我還活著'`);
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
      const { jobs } = resp.body;
      // eslint-disable-next-line no-restricted-syntax
      for (const job of jobs) {
        if (job.id === originPostId) break;
        const title = job.job_title.toLowerCase();
        if (keywords.length === 0 || keywords.some((kw) => title.includes(kw))) {
          const url = `https://chickpt.com.tw/dl?tp=4&um=1&ti=${job.id}&e=share_job`;
          const messageContent = `${job.job_title} ${job.job_salary}\n${url}`;
          sendLineNotify(messageContent, process.env.LINE_NOTIFY_TOKEN);
          console.log(`${new Date()}: ${messageContent}`);
        }
      }
      originPostId = jobs[0].id;
    } catch (error) {
      if (countFail > 10) {
        await sendLineNotify(`\n好像出事了! 但是我嘗試重新拿 Token 第 ${countFail} 次了所以暫時先把程式關閉，有空可以檢查一下。\n `, process.env.LINE_NOTIFY_TOKEN);
        clearInterval(stopIntervalId);
      } else if (countFail >= 3) {
        await sendLineNotify(`\n噴了三次 error，有空檢查一下`, process.env.LINE_NOTIFY_TOKEN);
      }
      console.error(`Fetch failed: ${error}`);
      countFail += 1;
    }
  }, process.env.REQUEST_FREQUENCY);
})();
