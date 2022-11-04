import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export interface Config {
  TESTNET_ENDPOINT: string;
  TESTNET_APIKEY: string | null;
  WALLET_ADDRESS: string;
  INTERVAL: number;
  PORT: number;
  ADDRESS: string;
}

interface ENV {
  TESTNET_ENDPOINT: string;
  TESTNET_APIKEY: string | null;
  WALLET_ADDRESS: string;
  INTERVAL: string | number;
  PORT: string | number;
  ADDRESS: string;
}

const getConfig = (): ENV => {
  return {
    TESTNET_ENDPOINT: process.env.TESTNET_ENDPOINT,
    TESTNET_APIKEY: process.env.TESTNET_APIKEY
      ? process.env.TESTNET_APIKEY
      : null,
    WALLET_ADDRESS: process.env.WALLET_ADDRESS,
    INTERVAL: process.env.INTERVAL
      ? Number(process.env.INTERVAL)
      : process.env.INTERVAL,
    PORT: process.env.PORT ? Number(process.env.PORT) : "", // Shorthand to empty variable in .env
    ADDRESS: process.env.ADDRESS,
  };
};

const getSanitzedConfig = (config: ENV): Config => {
  for (const [key, value] of Object.entries(config).filter(
    ([_, value]) => value !== null
  )) {
    if (value.length === 0) {
      throw new SyntaxError(`Missing key ${key} in .env`);
    }
  }
  return config as Config;
};

const config = getSanitzedConfig(getConfig());

export default config;
