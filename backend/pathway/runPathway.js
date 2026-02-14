const { exec } = require("child_process");

function runPathway() {
  return new Promise((resolve, reject) => {

    exec("py pathway/ranking.py", (err, stdout, stderr) => {
      if (err) {
        console.error(stderr);
        reject(err);
      } else {
        console.log("Pathway ranking completed");
        resolve();
      }
    });

  });
}

module.exports = runPathway;
