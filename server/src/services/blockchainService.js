// server/src/services/blockchainService.js
const Web3 = require('web3');
const DonationContract = require('../../blockchain/build/contracts/DonationContract.json');
const TransparencyContract = require('../../blockchain/build/contracts/TransparencyContract.json');

class BlockchainService {
  constructor() {
    this.web3 = new Web3(process.env.BLOCKCHAIN_PROVIDER);
    this.account = this.web3.eth.accounts.privateKeyToAccount(
      process.env.PRIVATE_KEY
    );
    this.web3.eth.accounts.wallet.add(this.account);
  }

  // Deploy donation smart contract
  async deployDonationContract(params) {
    try {
      const contract = new this.web3.eth.Contract(DonationContract.abi);
      
      const deployment = contract.deploy({
        data: DonationContract.bytecode,
        arguments: [
          this.web3.utils.toWei(params.target.toString(), 'ether'),
          params.beneficiaryAddress,
          params.organizationAddress
        ]
      });

      const gas = await deployment.estimateGas();
      const gasPrice = await this.web3.eth.getGasPrice();

      const deployedContract = await deployment.send({
        from: this.account.address,
        gas: Math.floor(gas * 1.2),
        gasPrice
      });

      return deployedContract.options.address;
    } catch (error) {
      console.error('Contract deployment failed:', error);
      throw new Error('Failed to deploy smart contract');
    }
  }

  // Process donation transaction
  async processDonation(params) {
    try {
      const contract = new this.web3.eth.Contract(
        DonationContract.abi,
        params.contractAddress
      );

      const tx = await contract.methods.donate().send({
        from: params.donorAddress,
        value: this.web3.utils.toWei(params.amount.toString(), 'ether'),
        gas: 200000
      });

      // Record transaction in transparency contract
      await this.recordTransaction({
        txHash: tx.transactionHash,
        donationContract: params.contractAddress,
        amount: params.amount,
        donor: params.donorAddress,
        timestamp: new Date().getTime()
      });

      return tx.transactionHash;
    } catch (error) {
      console.error('Donation transaction failed:', error);
      throw new Error('Failed to process donation on blockchain');
    }
  }

  // Record transaction for transparency
  async recordTransaction(params) {
    try {
      const transparencyContract = new this.web3.eth.Contract(
        TransparencyContract.abi,
        process.env.TRANSPARENCY_CONTRACT_ADDRESS
      );

      await transparencyContract.methods.recordTransaction(
        params.txHash,
        params.donationContract,
        this.web3.utils.toWei(params.amount.toString(), 'ether'),
        params.donor,
        params.timestamp
      ).send({
        from: this.account.address,
        gas: 150000
      });
    } catch (error) {
      console.error('Failed to record transaction:', error);
    }
  }

  // Verify transaction
  async verifyTransaction(txHash) {
    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      const transaction = await this.web3.eth.getTransaction(txHash);
      
      return {
        verified: receipt.status,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        gasUsed: receipt.gasUsed,
        amount: this.web3.utils.fromWei(transaction.value, 'ether'),
        from: transaction.from,
        to: transaction.to,
        timestamp: await this.getBlockTimestamp(receipt.blockNumber)
      };
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return { verified: false, error: error.message };
    }
  }

  // Get block timestamp
  async getBlockTimestamp(blockNumber) {
    const block = await this.web3.eth.getBlock(blockNumber);
    return new Date(block.timestamp * 1000);
  }

  // Get donation contract balance
  async getContractBalance(contractAddress) {
    try {
      const balance = await this.web3.eth.getBalance(contractAddress);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Failed to get contract balance:', error);
      return '0';
    }
  }
}

module.exports = new BlockchainService();