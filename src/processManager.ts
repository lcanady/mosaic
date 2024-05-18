// processManager.ts
import pm2 from "pm2";

// Function to start and watch a process using PM2
function startAndWatchProcess(script: string, name: string) {
  return new Promise<void>((resolve, reject) => {
    pm2.start(
      {
        script,
        name,
        interpreter: "ts-node",
      },
      (err, apps) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Started and watching ${name} process`);
          resolve();
        }
      }
    );
  });
}

// Initialize PM2
pm2.connect((err) => {
  if (err) {
    console.error("PM2 connection error:", err);
    process.exit(2);
  }

  // Start and watch the processes
  Promise.all([
    startAndWatchProcess("src/telnet.ts", "telnet"),
    startAndWatchProcess("src/app.ts", "MUSHServer"),
  ])
    .then(() => {
      console.log("All processes are started and watched");
    })
    .catch((error) => {
      console.error("Error:", error);
    })
    .finally(() => {
      pm2.disconnect();
    });
});
