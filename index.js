const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');
const moment = require('moment-timezone');

const slackToken = core.getInput('slack-token');
const slackChannel = core.getInput('slack-channel');

async function run() {
  try {
    core.setOutput('success', false);

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context, undefined, 2);
    const prLink = github.context.payload.pull_request._links.self.href;

    const reposPath = prLink.split('.com')[1];
    console.log(`The event payload: ${payload}`);
    console.log('reposPath: ', reposPath);

    const githubToken = core.getInput('github-token');
    const octokit = github.getOctokit(githubToken);
    const gitResponse = await octokit.request(`GET ${reposPath}`, {
      // owner: 'OWNER',
      // repo: 'REPO',
      // pull_number: 'PULL_NUMBER',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    const prLinkHtml = gitResponse.data.html_url;
    const user = gitResponse.data.user.login;
    const userUrl = gitResponse.data.user.html_url;
    const createdAt = moment
      .utc(gitResponse.data.created_at)
      .tz('Asia/Kolkata');
    const prTitle = gitResponse.data.title;
    const prNumber = gitResponse.data.number;
    const repository = gitResponse.data.head.repo.name;
    const prBody = gitResponse.data.body.slice(0, 20).concat('...');

    console.log(
      `gitApi Response: ${JSON.stringify(gitResponse, undefined, 2)}`
    );

    const response = await sendSlackAlert({
      prLinkHtml, user, userUrl, createdAt, prTitle, prNumber, repository, prBody
    });
    if (response.status === 200) {
      core.setOutput('success', true);
    }
  } catch (error) {
    console.log('err: ', error);
    core.setOutput('success', false);
    core.setFailed(error.message);
  }
}

async function sendSlackAlert(message) {
  const {
    prLinkHtml,
    user,
    userUrl,
    createdAt,
    prTitle,
    prNumber,
    repository,
    prBody
  } = message;
  const response = await axios.post(
    'https://slack.com/api/chat.postMessage',
    {
      channel: slackChannel,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'New PR opened',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Repository:*\n${repository}`
            },
            {
              type: 'mrkdwn',
              text: `*Created by:*\n<${userUrl}|${user}>`
            }
          ]
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*When:*\n${createdAt}`
            },
            {
              type: 'mrkdwn',
              text: `*Title:*\n${prTitle}`
            }
          ]
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*PR Number:*\n${prNumber}`
            },
            {
              type: 'mrkdwn',
              text: `*PR Body:*\n${prBody}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<${prLinkHtml}|View PR>`
          }
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${slackToken}`
      }
    }
  );
  return response;
}

run();
