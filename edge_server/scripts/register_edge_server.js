#!/usr/bin/env node
const { ethers } = require('ethers');
const config = require('../config/config');

async function main() {
  const raw = process.argv.slice(2);
  const args = {};
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const next = raw[i+1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }

  const adminKey = args['admin-key'] || process.env.ADMIN_PRIVATE_KEY || process.env.GANACHE_PRIVATE_KEY;
  const privateKey = args['private-key'] || args['pk'];
  const serverId = args['server-id'] || args['id'] || 'RSU-unknown';
  const location = args['location'] || '';
  const fundAmount = args['fund-amount'] || args['fund'] || process.env.FUND_AMOUNT; // in ETH

  const ganache = process.env.GANACHE_RPC_URL || config.GANACHE_RPC_URL;
  const edgeRegistryAddr = process.env.EDGE_SERVER_REGISTRY_ADDRESS || process.env.EDGE_REGISTRY_ADDRESS;

  if (!adminKey) {
    console.error('Admin private key required via --admin-key or ADMIN_PRIVATE_KEY env');
    process.exit(1);
  }

  if (!privateKey) {
    console.error('Instance private key required via --private-key');
    process.exit(1);
  }

  if (!edgeRegistryAddr) {
    console.error('EDGE_SERVER_REGISTRY_ADDRESS must be set in environment');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(ganache);
  const adminWallet = new ethers.Wallet(adminKey, provider);

  // helper to fetch latest nonce including pending transactions
  async function getAdminNonce() {
    return await provider.getTransactionCount(adminWallet.address, 'pending');
  }

  const registry = new ethers.Contract(edgeRegistryAddr, config.EDGE_SERVER_REGISTRY_ABI, adminWallet);

  const instanceWallet = new ethers.Wallet(privateKey, provider);
  const serverAddress = instanceWallet.address;

  try {
    if (fundAmount) {
      // send ETH from admin to instance (use explicit nonce)
      const value = ethers.parseEther(String(fundAmount));
      let nonce = await getAdminNonce();
      const txFund = await adminWallet.sendTransaction({ to: serverAddress, value, nonce });
      await txFund.wait();
      // Don't output funding JSON to avoid multiple JSON parsing issues
    }

    // Retry logic for registration with nonce handling
    let retries = 3;
    let tx;
    while (retries > 0) {
      try {
        const nonce = await getAdminNonce();
        tx = await registry.registerEdgeServer(serverId, serverAddress, location, { nonce });
        break; // Success, exit retry loop
      } catch (err) {
        if (err.message.includes('nonce') && retries > 1) {
          console.error(`Nonce error, retrying... (${retries-1} attempts left)`);
          // Wait a bit and sync nonce
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries--;
          continue;
        }
        throw err; // Re-throw if not a nonce error or out of retries
      }
    }
    
    const receipt = await tx.wait();
    console.log(JSON.stringify({ success: true, txHash: tx.hash, serverAddress }));
    process.exit(0);
  } catch (err) {
    process.exit(2);
  }
}

main().catch(e => {
  console.error('registrar error', e.message);
  process.exit(1);
});
