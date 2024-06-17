const express = require('express');
const { exec } = require('child_process');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  const serveoProcess = exec('ssh -tt -o StrictHostKeyChecking=no -R moroccoai120120a:80:localhost:3000 serveo.net');

  serveoProcess.stdout.on('data', (data) => {
    console.log(`Serveo link: ${data}`);
  });

  serveoProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  serveoProcess.on('close', (code) => {
    console.log(`Serveo process exited with code ${code}`);
  });
});
