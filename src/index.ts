import App from "./app/main";
import config from "./config";
import readline from "readline";

const app = new App(config);

app.start();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("SIGINT", async () => {
  console.info("Gracefully exiting application...");
  await app.stop();
  console.info("Services are down, closing now...");

  process.exit();
});
