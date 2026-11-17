import fs from 'node:fs';
import path from 'node:path';
import childProcess from 'node:child_process';
import * as core from '@actions/core';
import { DefaultArtifactClient } from '@actions/artifact';
import JSON5 from 'json5';

(async () => {
  try {
    const manifestPath = core.getInput('manifest');
    console.log(`Read manifest from ${manifestPath}...`);
    let content = fs.readFileSync(manifestPath, 'utf8');

    const tokensStr = core.getInput('tokens');
    if (tokensStr) {
      const tokens = JSON5.parse(tokensStr);
      console.log('Replace tokens...');
      console.log(tokens);
      content = Object.keys(tokens).reduce(
        (acc, cur) => acc.replaceAll(cur, tokens[cur]),
        content,
      );
      fs.writeFileSync(manifestPath, content);
    }

    const makeArtifact = core.getInput('artifact');
    if (makeArtifact === 'true') {
      console.log('Upload artifact...');
      const artifactClient = new DefaultArtifactClient();
      await artifactClient.uploadArtifact(
        path.basename(manifestPath),
        [manifestPath],
        path.dirname(manifestPath),
      );
    }

    const namespace = core.getInput('namespace');
    let command = `kubectl apply -f ${manifestPath}`;
    if (namespace) {
      command += ` -n ${namespace}`;
    }
    console.log('Apply manifest...');
    console.log(command);

    const dryRun = core.getInput('dry-run');
    if (dryRun !== 'true') {
      const output = childProcess.execSync(command);
      console.log(output.toString());
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
