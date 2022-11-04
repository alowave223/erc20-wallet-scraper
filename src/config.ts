import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export interface Config {
  PROVIDER_ENDPOINT: string;
  PROVIDER_APIKEY: string | null;
  WALLET_ADDRESS: string;
  INTERVAL: number;
  PORT: number | any;
  ADDRESS: string;
}

const getConfig = (): Config => {
  return {
    PROVIDER_ENDPOINT: process.env.PROVIDER_ENDPOINT,
    PROVIDER_APIKEY: process.env.PROVIDER_APIKEY
      ? process.env.PROVIDER_APIKEY
      : null,
    WALLET_ADDRESS: process.env.WALLET_ADDRESS,
    INTERVAL: process.env.INTERVAL
      ? Number(process.env.INTERVAL)
      : process.env.INTERVAL,
    PORT: process.env.PORT ? Number(process.env.PORT) : "", // Shorthand to empty variable in .env
    ADDRESS: process.env.ADDRESS,
  };
};

const getSanitzedConfig = (config: Config): Config => {
  for (const [key, value] of Object.entries(config).filter(
    ([_, value]) => value !== null
  )) {
    if (value.length === 0) {
      throw new SyntaxError(`Missing key ${key} in .env`);
    }
  }
  return config;
};

const config = getSanitzedConfig(getConfig());

export default config;
