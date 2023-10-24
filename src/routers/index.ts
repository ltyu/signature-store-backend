import fs from "fs"
import * as dotenv from "dotenv";
import express from "express";
import { ethers } from "ethers";

dotenv.config({path: __dirname + "../../.env"});

const router = express.Router();
const collateralVaultABI = JSON.parse(fs.readFileSync("./abi/collateralVault.json", "utf-8"))

// Persistant storage
// address => EIP-712 signed data type 
let storage: any = {};

// Attempts to repay using a signature
router.post("/repay/:address", async (req, res) =>{
  try {
    const { address } = req.params;
    const signature = storage[address.toLowerCase()];
    console.log(`Signature ${signature}`);
    
    if (signature!!) {
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!)
      const signer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, provider)
    
      const { v, r, s } = ethers.utils.splitSignature(signature);

      const collateralVault = new ethers.Contract(process.env.COLLATERAL_VAULT_ADDR!, collateralVaultABI);
      let unsignedTx = await collateralVault.populateTransaction.repayPermit(address, v, r, s);
      unsignedTx.gasLimit = ethers.BigNumber.from("350000");
      
      const tx = await signer.sendTransaction(unsignedTx);
      res.send(tx.hash);
    }
  } catch (error) {
    throw error;
  }
});

// Stores a signature
router.post("/signature", async (req, res) =>{
  try {
    const { signer, signature } = req.body;
    storage[signer.address.toLowerCase()] = signature;
    console.log(`Signature added ${signature} for address: ${signer.address}`);
    res.send();
  } catch (error) {
    throw error;
  }
})

// Checks liquidatable
router.use("/liquidatable", async (req, res) => {
    try {
      console.log("Checking for liquidation");
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL!);
      const signer = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, provider)
      
      const collateralVault = new ethers.Contract(process.env.COLLATERAL_VAULT_ADDR!, collateralVaultABI, signer);
      const isLiquidatable = await collateralVault.isLiquidatable();
      res.send(isLiquidatable);
    } catch (error) {
      throw error;
    }
});

export default router;