const express = require('express');
const { exec } = require('child_process');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  
  // إنشاء مفتاح SSH
  const keygenProcess = exec('ssh-keygen -t rsa -b 4096 -C "azaa88777@gmail.com" -f "./serveo_key" -N "12345678"',
    (error, stdout, stderr) => {
      if (error) {
        console.error(`keygen error: ${error}`);
        return;
      }
      console.log(`keygen stdout: ${stdout}`);
      if (stderr) {
        console.error(`keygen stderr: ${stderr}`);
      }
      
      // استخدام المفتاح لفتح الخادم مع Serveo
      const serveoProcess = exec('ssh -tt -o StrictHostKeyChecking=no -i "./serveo_key" -R moroccoai120120a:80:localhost:3000 serveo.net');

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
});
