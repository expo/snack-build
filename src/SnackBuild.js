/* eslint no-unused-vars: ["error", { "ignoreRestSiblings": true }] */

import { GraphQLClient } from 'graphql-request';

const DEFAULT_API_URL = 'https://expo.io';
const DEFAULT_SDK_VERSION = '35.0.0';

/**
 * Builds an apk from the snack and returns a url to download the apk.
 * @param
 * @returns {Promise.<string>} A promise that contains the url when fulfilled.
 * @function
 */
export async function getApkUrlAsync(appJson, options = {}) {
  const { expoApiUrl = DEFAULT_API_URL } = options;
  const manifest = appJson.expo;
  const { id: buildId } = await buildAsync(manifest, {
    platform: 'android',
    mode: 'create',
    isSnack: true,
    sdkVersion: DEFAULT_SDK_VERSION,
    ...options,
  });

  const completedJob = await waitForBuildJob(buildId, manifest, 'android', options);
  const artifactUrl = completedJob.artifactId
    ? `${expoApiUrl}/artifacts/${completedJob.artifactId}`
    : completedJob.artifacts.url;

  return artifactUrl;
}

const sleep = ms => new Promise(res => setTimeout(res, ms));
const secondsToMilliseconds = seconds => seconds * 1000;

async function waitForBuildJob(buildId, manifest, platform, opts = {}) {
  const { timeout = 1200, interval = 60, ...options } = opts;
  let time = new Date().getTime();
  await sleep(secondsToMilliseconds(interval));
  const endTime = time + secondsToMilliseconds(timeout);
  while (time <= endTime) {
    const result = await buildAsync(manifest, {
      current: false,
      mode: 'status',
      platform,
      ...options,
    });
    const { jobs = [] } = result;
    const job = jobs.find(job => buildId && job.id === buildId);
    if (!job) {
      throw new Error(`Build not found: ${buildId}`);
    }
    if (job.status === 'finished') {
      return job;
    } else if (job.status === 'errored') {
      throw new Error(`Job status: ${job.status}`);
    }
    time = new Date().getTime();
    await sleep(secondsToMilliseconds(interval));
  }
}

function constructUser(user, authorizationToken, sessionSecret) {
  const suppliedUser = user || {};
  return {
    ...{
      idToken: authorizationToken,
      sessionSecret,
    },
    ...suppliedUser,
  };
}

export async function buildAsync(manifest, opts) {
  const { user, authorizationToken, sessionSecret, expoApiUrl = DEFAULT_API_URL, ...options } = opts;
  const url = `${expoApiUrl}/--/api/build`;
  const fullUser = constructUser(user, authorizationToken, sessionSecret);
  const payload = {
    manifest,
    options,
  };

  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        ...(fullUser.idToken ? { Authorization: `Bearer ${fullUser.idToken}` } : {}),
        ...(fullUser.sessionSecret ? { 'Expo-Session': fullUser.sessionSecret } : {}),
      },
    });
    if (response.ok) {
      return response.json();
    } else {
      const err = new Error(`${response.status} server error: ${response.statusText}`);
      console.error(err);
      throw err;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function cancelBuild(options, buildId) {
  const { user, authorizationToken, sessionSecret, expoApiUrl = DEFAULT_API_URL } = options;
  const url = `${expoApiUrl}/--/graphql`;
  const fullUser = constructUser(user, authorizationToken, sessionSecret);
  const graphQLClient = new GraphQLClient(url, {
    headers: {
      ...(fullUser.idToken ? { Authorization: `Bearer ${fullUser.idToken}` } : {}),
      ...(fullUser.sessionSecret ? { 'Expo-Session': fullUser.sessionSecret } : {}),
    },
  });

  const variables = { buildId };
  const query = `
    mutation CancelJob($buildId: ID!) {
      buildJob(buildId: $buildId){
        cancel { id status }
      }
    }
  `;

  return graphQLClient.request(query, variables);
}
