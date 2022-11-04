import { Config } from "src/config";
import { Server } from "http";
import express from "express";
import indexRoute from "./routes/indexRoute";
import Scraper from "./scraper";

export default class App {
  private config: Config;
  public webServer: Server;
  public scraper: Scraper;

  constructor(config: Config) {
    this.config = config;
  }

  private runWebServer() {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get("/", indexRoute);

    this.webServer = app.listen(this.config.PORT, this.config.ADDRESS, () => {
      console.log(
        `Running the express server on ${this.config.ADDRESS}:${this.config.PORT}`
      );
    });
  }

  public async start() {
    console.log("Starting the application...");
    this.runWebServer();

    this.scraper = new Scraper(this.config);
    await this.scraper.start();
    console.log("Application has been started!");
  }

  public async stop() {
    console.log("Stopping the application!");

    this.webServer.close();
    await this.scraper.stop();
  }
}
