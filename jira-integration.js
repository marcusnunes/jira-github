/* eslint-disable no-console */
const axios = require('axios');

const jiraURL = 'https://z-tech.atlassian.net/rest/api/latest/issue';
const jiraUser = process.env.JIRA_USER;
const jiraPassword = process.env.JIRA_PASSWORD;

const githubData = process.env.GITHUB;
const currentStep = process.env.STEP || 'CODE_REVIEW';

const STEPS = {
  CODE_REVIEW: /^(code\sreview|review)$/i,
  MERGE: /^(aguardando\sbuild|ready\sfor\sqa|ready\sfor\svalidation|homolog|staging|staging\senvironment)$/i,
};

function findTasks(text) {
  const regex = /(CIN|DCP|DCI|DCO|DG|DCOT|DCRED)-([0-9]+)/g;
  return text.match(regex);
}

function findColumn(regex, columns) {
  const index = columns.findIndex(({ name }) => regex.test(name));

  return columns[index] || null;
}

async function getTransitions(task) {
  try {
    const { data } = await axios.get(`${jiraURL}/${task}/transitions`, {
      auth: {
        username: jiraUser,
        password: jiraPassword,
      },
    });

    return data.transitions.map(({ id, name }) => ({ id, name }));
  } catch (error) {
    console.log(error);
  }
  return null;
}

async function moveTask(task, column) {
  const data = {
    transition: {
      id: column,
    },
  };

  try {
    await axios.post(`${jiraURL}/${task}/transitions`, data, {
      auth: {
        username: jiraUser,
        password: jiraPassword,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
      const columns = await getTransitions(item);

      const moveTo = findColumn(STEPS[currentStep], columns);

      if (moveTo) {
        console.log('---------------------------------------------------');
        console.log(`Moving task ${item} to column "${moveTo.name}"`);
        console.log('---------------------------------------------------');

        await moveTask(item, moveTo.id);
      }
    });
  } catch (e) {
    console.log('Something went wrong...');
  }
}

start();
