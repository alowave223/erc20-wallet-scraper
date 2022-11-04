import { Request, Response } from "express";
import fs from "fs";

export default (_: Request, res: Response) => {
  if (!fs.existsSync("./wallet.json")) return res.status(405);

  let rawFile = fs.readFileSync("./wallet.json");
  return res.status(200).json(JSON.parse(rawFile.toString()));
};