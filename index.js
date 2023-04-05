const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

async function run() {
  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context, undefined, 2);
    console.log(`The event payload: ${payload}`);

    const slackToken = core.getInput('slack-token');
    const slackChannel = core.getInput('slack-channel');
    const githubToken = core.getInput('github-token');

    console.log(`Running execution: `, slackChannel);
    const octokit = github.getOctokit(githubToken);
    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: slackChannel,
        text: 'Test Message'
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
  } catch (error) {
    console.log('err: ', error);
    // core.setFailed(error.message);
  }
}

run();
