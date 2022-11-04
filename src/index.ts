import App from "./app/main";
import config from "./config";

const app = new App(config);

process.on('exit', () => {
  app.stop();
});
app.start();