const IBCPacket = artifacts.require("IBCPacket");
const IBCConnection = artifacts.require("IBCConnection");
const IBCChannel = artifacts.require("IBCChannelHandshake");
const IBCClient = artifacts.require("IBCClient");
const IBCHandler = artifacts.require("OwnableIBCHandler");

require("dotenv").config({
  path: `${__dirname}/../.env`,
});
const ethers = require("ethers");
const mnemonic = "test test test test test test test test test test test junk";

module.exports = async function (deployer, network) {
  if (network == "development") {
    console.log("Deploy contracts for network " + network);
    const IBCMockHandler = artifacts.require("IBCMockHandler");
    const MockClient = artifacts.require("MockClient");
    const MockModule = artifacts.require("MockModule");

    await deployer.deploy(IBCPacket);
    await deployer.deploy(IBCConnection);
    await deployer.deploy(IBCChannel);
    await deployer.deploy(IBCClient);

    const ibcClient = await IBCClient.deployed();
    const ibcPacket = await IBCPacket.deployed();
    const ibcConnection = await IBCConnection.deployed();
    const ibcChannel = await IBCChannel.deployed();
    await deployer.deploy(
      IBCMockHandler,
      ibcClient.address,
      ibcConnection.address,
      ibcChannel.address,
      ibcPacket.address
    );
    const ibcTestHandler = await IBCMockHandler.deployed();
    await deployer.deploy(MockClient);
    await ibcTestHandler.registerClient("MockClient", MockClient.address);
    await deployer.deploy(MockModule);
    console.log("Done deploying contracts");
  } else {
    // production
    const clientAddress = await deployContract("IBCPacket");
    const connectionAddress = await deployContract("IBCConnection");
    const channelAddress = await deployContract("IBCChannelHandshake");
    const packetAddress = await deployContract("IBCClient");
    await deployContract(
      "OwnableIBCHandler",
      clientAddress,
      connectionAddress,
      channelAddress,
      packetAddress
    );
  }
};

async function deployContract(contractName, ...args) {
  const provider = new ethers.providers.JsonRpcProvider(process.env.AXON_RPC_URL);
  const signer = new ethers.Wallet.fromMnemonic(mnemonic).connect(provider);
  const contract = artifacts.require(contractName); // load contract from json
  const abi = new ethers.utils.Interface(contract.abi);
  const factory = new ethers.ContractFactory(abi, contract.bytecode, signer);
  const contractInstance = await factory.deploy(...args);
  // console.log(contractInstance);
  console.log("Done Deployment " + contractName + " at " + contractInstance.address);
  return contractInstance.address;
}
