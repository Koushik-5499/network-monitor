const { spawn } = require('child_process');

function execCommand(command, args = [], timeoutMs = 5000) {
  return new Promise((resolve) => {
    const child = spawn(command, args);
    let stdout = '';
    let stderr = '';

    const timeout = setTimeout(() => {
      child.kill();
      resolve({ stdout: '', stderr: 'Timeout', code: null, error: new Error('Timeout') });
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      resolve({ stdout, stderr, code: null, error });
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve({ stdout, stderr, code, error: null });
    });
  });
}

module.exports = { execCommand };
