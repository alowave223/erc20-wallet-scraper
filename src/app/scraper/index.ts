import { Config } from "src/config";
import Web3 from "web3";
import axios, { AxiosInstance } from "axios";
import {
  setIntervalAsync,
  clearIntervalAsync,
  SetIntervalAsyncTimer,
} from "set-interval-async";
import fs from "fs";

interface Token {
  id: string;
  symbol: string;
  name: string;
  platforms: {
    [key: string]: string;
  };
}

export default class Scraper {
  private config: Config;
  private web3Instance: Web3;
  private axiosInstance: AxiosInstance;
  private tokens: Token[] = [];
  private timer: SetIntervalAsyncTimer<any>;

  private balanceOfABI = [
    {
      constant: true,
      inputs: [
        {
          name: "_owner",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          name: "balance",
          type: "uint256",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
  ];

  constructor(config: Config) {
    this.config = config;
  }

  private async getAlltokens(): Promise<Token[]> {
    const response: Token[] = (
      await this.axiosInstance.get(
        "https://api.coingecko.com/api/v3/coins/list",
        {
          params: {
            include_platform: true,
          },
        }
      )
    ).data;

    return response.filter((token) =>
      Object.hasOwn(token.platforms, "ethereum")
        ? token.platforms.ethereum!.length > 0
        : false
    );
  }

  private async getBalances(): Promise<
    {
      token: Token | any;
      balance: string;
    }[]
  > {
    const balances: {
      token: Token | any;
      balance: string;
    }[] = [];

    for (let index = 0; index < this.tokens.length; index++) {
      const contract = new this.web3Instance.eth.Contract(
        this.balanceOfABI,
        this.tokens.at(index)!.platforms.ethereum
      );

      if (!contract.methods.balanceOf) continue;

      try {
        // @ts-ignore
        const contractResult: string = await contract.methods
          // @ts-ignore
          .balanceOf(this.config.WALLET_ADDRESS)
          .call();

        const balance = this.web3Instance.utils.fromWei(
          BigInt(contractResult),
          "ether"
        );
        balances.push({
          token: this.tokens.at(index),
          balance: balance,
        });
      } catch (e) {
        console.info(`${this.tokens.at(index)!.symbol}: Not Found.`);
      }
    }

    return balances;
  }

  private async job(): Promise<void> {
    const balances = await this.getBalances();

    fs.writeFileSync("./wallet.json", JSON.stringify(balances, null, 3));
  }

  public async start(): Promise<void> {
    this.web3Instance = new Web3(
      `${this.config.PROVIDER_ENDPOINT}${
        this.config.PROVIDER_APIKEY != null
          ? "/" + this.config.PROVIDER_APIKEY
          : ""
      }`
    );

    this.axiosInstance = axios.create({
      headers: {
        "Content-Type": "application/json",
      },
      transformRequest: [
        (data) => {
          return JSON.stringify(data);
        },
      ],
      transformResponse: [
        (data) => {
          return JSON.parse(data);
        },
      ],
    });

    this.tokens = await this.getAlltokens();
    this.timer = setIntervalAsync(async () => {
      await this.job();
    }, this.config.INTERVAL * 100);
  }

  public async stop() {
    console.info("Stopping the scraper...");

    await clearIntervalAsync(this.timer);
    this.tokens = [];

    console.info("Scraper has been stoped.");
  }
}
