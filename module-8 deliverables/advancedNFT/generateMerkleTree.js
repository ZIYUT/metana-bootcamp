const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

const addresses = [
  "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
  "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
];

const leaves = addresses.map((addr, index) =>
  keccak256(Buffer.from(addr.slice(2) + index.toString().padStart(64, "0"), "hex"))
);
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
const root = tree.getHexRoot();
console.log("Merkle Root:", root);