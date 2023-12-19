require('dotenv').config();
const { Web3 } = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const { ethers } = require('ethers');

const providerUrl = process.env.PROVIDER_URL;
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey || !providerUrl) {
  console.error('Please provide PRIVATE_KEY and PROVIDER_URL in .env file');
  process.exit(1);
}

const web3 = new Web3(providerUrl);

const routerABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "path",
        "type": "address[]"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "swapExactETHForTokens",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "amounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

const routerAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

const wallet = new ethers.Wallet(privateKey);
const signer = new ethers.Wallet(wallet.privateKey, web3);
const routerContract = new web3.eth.Contract(routerABI, routerAddress);

const amountInWei = '1'; // 1 Wei
const amountInHex = web3.utils.toHex(amountInWei);
console.log(amountInHex); // Output: '0x1'

const path = [
  '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', // WETH address
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI address
];
const to = wallet.address;

const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

routerContract.methods.swapExactETHForTokens(
  '0',
  path,
  to,
  deadline
).estimateGas({ from: wallet.address, value: amountInHex })
  .then((gasEstimate) => {
    const txData = routerContract.methods.swapExactETHForTokens(
      '0',
      path,
      to,
      deadline
    ).encodeABI();

    const txParams = {
      gasLimit: web3.utils.toHex(gasEstimate),
      gasPrice: web3.utils.toHex(20e9), // Gas price in Wei (20 Gwei)
      to: routerAddress,
      from: wallet.address,
      data: txData,
      value: amountInHex
    };

    const tx = new Tx(txParams, { chain: 'goerli' });

    tx.sign(Buffer.from(privateKey, 'hex'));

    const serializedTx = tx.serialize();

    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
      .on('transactionHash', (hash) => {
        console.log('Transaction Hash:', hash);
      })
      .on('receipt', (receipt) => {
        console.log('Transaction Receipt:', receipt);
      })
      .on('error', (error) => {
        console.error('Transaction Error:', error);
      });
  })
  .catch((error) => {
    console.error('Error:', error);
  });
