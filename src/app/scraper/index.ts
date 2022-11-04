import { Config } from "src/config";
import Web3 from "web3";
import axios, { AxiosInstance } from "axios";
import { setIntervalAsync } from "set-interval-async";
import fs from "fs";

export default class Scraper {
  private config: Config;
  private web3Instance: Web3;
  private axiosInstance: AxiosInstance;
  private tokenAddresses: Array<{
    tokenSymbol: string;
    tokenAddress: string;
  }> = [];

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

  private async getAllTokenAddresses(): Promise<
    { tokenSymbol: string; tokenAddress: string }[]
  > {
    const ret = [];
    const response = await this.axiosInstance.get(
      "https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/ethereum.json"
    );

    for (let token of response.data) {
      ret.push({
        tokenSymbol: token.symbol,
        tokenAddress: token.address,
      });
    }

    return ret;
  }

  private async getBalances(): Promise<
    {
      symbol: string;
      balance: string;
    }[]
  > {
    const promises: Promise<string>[] = [];
    const balances: {
      symbol: string;
      balance: string;
    }[] = [];

    for (const token of this.tokenAddresses) {
      const contract = new this.web3Instance.eth.Contract(
        this.balanceOfABI,
        token.tokenAddress
      );

      if (!contract.methods.balanceOf) continue;

      try {
        promises.push(
          // @ts-ignore
          contract.methods
            // @ts-ignore
            .balanceOf(this.config.WALLET_ADDRESS)
            .call()
        );
      } catch (e) {
        console.log(`${token.tokenSymbol}: Not Found.`);
      }
    }

    const promiseResults = await Promise.allSettled(promises);
    for (let index = 0; index < promiseResults.length; index++) {
      const promiseResult = promiseResults[index];
      if (promiseResult?.status !== "fulfilled") continue;

      const balance = this.web3Instance.utils.fromWei(
        BigInt(promiseResult.value),
        "milliether"
      );
      balances.push({
        symbol: this.tokenAddresses[index]!.tokenSymbol,
        balance: balance,
      });
    }

    const ethereumBalance = await this.web3Instance.eth.getBalance(this.config.WALLET_ADDRESS);
    balances.push({
      symbol: "ETH",
      balance: this.web3Instance.utils.fromWei(ethereumBalance, "milliether")
    });

    return balances;
  }

  private async job(): Promise<void> {
    const balances = await this.getBalances();

    fs.writeFileSync("./wallet.json", JSON.stringify(balances, null, 3));
  }

  public async start(): Promise<void> {
    this.web3Instance = new Web3(
      `${this.config.TESTNET_ENDPOINT}${
        this.config.TESTNET_APIKEY != null
          ? "/" + this.config.TESTNET_APIKEY
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

    this.tokenAddresses = await this.getAllTokenAddresses();
    setIntervalAsync(async () => {
      await this.job();
    }, this.config.INTERVAL * 100);
  }
}
