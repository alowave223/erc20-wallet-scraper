import { Config } from "src/config";
import { Express } from 'express';
import express from 'express';
import indexRoute from "./routes/indexRoute";
import Scraper from "./scraper";

export default class App {
  private config: Config;
  public webServer: Express;

  constructor(config: Config) {
    this.config = config;
  }

  private runWebServer() {
    this.webServer = express();

    this.webServer.use(express.json());
    this.webServer.use(express.urlencoded({ extended: true }));

    this.webServer.get("/", indexRoute);

    this.webServer.listen(this.config.PORT, this.config.ADDRESS, () => {
      console.log(`Running the express server on ${this.config.ADDRESS}:${this.config.PORT}`);
    });
  }

  public async start() {
    console.log("Starting the application...");
    this.runWebServer();
    
    const scraper = new Scraper(this.config);
    scraper.start();
  }

  public stop() {
    console.log("Stopping the application!");
  }
}