/* eslint-disable no-console */
const https = require('https');

const jiraURL = 'https://z-tech.atlassian.net/rest/api/latest/issue';
const jiraUser = process.env.JIRA_USER;
const jiraPassword = process.env.JIRA_PASSWORD;

const githubData = process.env.GITHUB;
const currentStep = process.env.STEP || 'CODE_REVIEW';

const STEPS = {
  CODE_REVIEW: /^(code\sreview|review|product\sreview)$/i,
  MERGE: /^(aguardando\sbuild|ready\sfor\sqa|ready\sfor\svalidation|homolog|staging|staging\senvironment)$/i,
};

function findTasks(text) {
  const regex = /(DCI|LM|DBK|DBS|JV|DCO|DCOT|DCRED)-([0-9]+)/g;
  return text.match(regex);
}

function findColumn(regex, columns) {
  const index = columns.findIndex(({ name }) => regex.test(name));
  return columns[index] || null;
}

function base64encode(str) {
  // eslint-disable-next-line no-undef
  const buff = Buffer.from(str, 'utf-8');
  return buff.toString('base64');
}

function request(method, url, data) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-undef
    const parseURL = new URL(url);

    const headers = {
      authorization: `Basic ${base64encode(jiraUser + ':' + jiraPassword)}`,
      'Content-Type': 'application/json',
    };

    if (data) {
      headers['Content-Length'] = data.length;
    }

    const options = {
      host: parseURL.host,
      path: `${parseURL.pathname}${parseURL.search}`,
      port: 443,
      method,
      headers,
    };

    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      let responseBody = '';

      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () =>
        resolve(responseBody ? JSON.parse(responseBody) : '')
      );
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function getTransitions(task) {
  try {
    const data = await request('GET', `${jiraURL}/${task}?expand=transitions`);

    return {
      currentStatus: data.fields.status.name,
      columns: data.transitions.map(({ id, name }) => ({ id, name })),
    };
  } catch (error) {
    console.log(error);
  }
}

async function moveTask(task, column) {
  const data = JSON.stringify({
    transition: {
      id: column,
    },
  });

  try {
    await request('POST', `${jiraURL}/${task}/transitions`, data);

    console.log(`Task ${task} updated`);
  } catch (error) {
    console.log(error);
  }
}

function start() {
  try {
    const github = JSON.parse(githubData);

    const title =
      currentStep === 'CODE_REVIEW'
        ? github.event.pull_request.title
        : github.event.head_commit.message;

    const tasks = findTasks(title);

    if (!tasks) {
      console.log('Nothing found...');
      return;
    }

    tasks.forEach(async (item) => {
      const { currentStatus, columns } = await getTransitions(item);

      const moveTo = findColumn(STEPS[currentStep], columns);

      if (moveTo && moveTo.name !== currentStatus) {
        console.log('---------------------------------------------------');
        console.log(`Moving task ${item} to column "${moveTo.name}"`);
        console.log('---------------------------------------------------');

        await moveTask(item, moveTo.id);
      } else {
        console.log('---------------------------------------------------');
        console.log('Nothing to move');
        console.log('---------------------------------------------------');
      }
    });
  } catch (e) {
    console.log('Something went wrong...');
  }
}

start();
