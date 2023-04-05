const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

async function run() {
  try {
    const slackToken = core.getInput('slack-token');
    const slackChannel = core.getInput('slack-channel');
    core.setOutput('success', false);

    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: slackChannel,
        text: 'PR has been opened'
      },
      {
        headers: {
          Authorization: `Bearer ${slackToken}`
        }
      }
    );
    if (response.status === 200) {
      core.setOutput('success', true);
    }

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context, undefined, 2);
    const prLink = github.context.payload.pull_request._links.self.href;

    const reposPath = prLink.split('.com')[1];
    console.log(`The event payload: ${payload}`);
    console.log('reposPath: ', reposPath);

    const githubToken = core.getInput('github-token');
    const octokit = github.getOctokit(githubToken);
    const gitResponse = await octokit.request(`GET ${reposPath}`, {
      owner: 'OWNER',
      repo: 'REPO',
      pull_number: 'PULL_NUMBER',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    console.log(
      `gitApi Response: ${JSON.stringify(gitResponse, undefined, 2)}`
    );
  } catch (error) {
    console.log('err: ', error);
    core.setOutput('success', false);
    core.setFailed(error.message);
  }
}

run();
