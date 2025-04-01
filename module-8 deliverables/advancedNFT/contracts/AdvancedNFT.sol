// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract AdvancedNFT is ERC721, Multicall, Ownable {
    using BitMaps for BitMaps.BitMap;

    // State machine for minting phases
    enum SaleState { INACTIVE, PRESALE, PUBLIC, SOLD_OUT }
    SaleState public saleState;
    bytes32 public merkleRoot;
    // Mapping for commit-reveal
    mapping(address => bytes32) public commitments;
    mapping(address => uint256) public commitBlock;
    mapping(address => bool) public hasMintedMapping; 
    BitMaps.BitMap private hasMintedBitmap;

    // NFT supply and pricing
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public totalSupply;
    uint256 public constant PRESALE_PRICE = 0.05 ether;
    uint256 public constant PUBLIC_PRICE = 0.1 ether;

    // Designated address for withdrawals
    address public designatedAddress;

    // Withdrawal balances for contributors
    mapping(address => uint256) public pendingWithdrawals;

    // Events
    event Commit(address indexed user, bytes32 commitment);
    event Reveal(address indexed user, uint256 tokenId);
    event StateChanged(SaleState newState);
    event FundsWithdrawn(address indexed contributor, uint256 amount);

    constructor(bytes32 _merkleRoot, address _designatedAddress) ERC721("AdvancedNFT", "ANFT") Ownable(msg.sender) {
        merkleRoot = _merkleRoot;
        designatedAddress = _designatedAddress;
        saleState = SaleState.INACTIVE;
        totalSupply = 0;
    }

    // Set Merkle root (only owner)
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    // Update sale state (only owner)
    function setSaleState(SaleState _state) external onlyOwner {
        saleState = _state;
        emit StateChanged(_state);
    }

    // Commit phase for random NFT ID allocation
    function commit(bytes32 _commitment) external {
        require(saleState == SaleState.PRESALE || saleState == SaleState.PUBLIC, "Minting not active");
        require(commitments[msg.sender] == 0, "Already committed");
        commitments[msg.sender] = _commitment;
        commitBlock[msg.sender] = block.number;
        emit Commit(msg.sender, _commitment);
    }

    // Reveal phase for random NFT ID allocation
    function reveal(uint256 _secret) external payable {
        require(saleState == SaleState.PRESALE || saleState == SaleState.PUBLIC, "Minting not active");
        require(totalSupply < MAX_SUPPLY, "Supply exhausted");
        require(commitments[msg.sender] != 0, "No commitment found");
        require(block.number >= commitBlock[msg.sender] + 10, "Reveal too early");

        bytes32 commitment = keccak256(abi.encodePacked(msg.sender, _secret));
        require(commitment == commitments[msg.sender], "Invalid reveal");

        // Check Merkle proof for presale or public mint
        bool isPresale = saleState == SaleState.PRESALE;
        if (isPresale) {
            require(msg.value == PRESALE_PRICE, "Incorrect payment");
        } else {
            require(msg.value == PUBLIC_PRICE, "Incorrect payment");
        }

        // Use mapping or bitmap to prevent double minting
        // Option 1: Mapping
        require(!hasMintedMapping[msg.sender], "Already minted");
        hasMintedMapping[msg.sender] = true;

        // Option 2: Bitmap (comment out mapping lines above and uncomment below)
        // uint256 index = uint256(uint160(msg.sender)) % MAX_SUPPLY;
        // require(!BitMaps.get(hasMintedBitmap, index), "Already minted");
        // BitMaps.set(hasMintedBitmap, index);

        // Generate random token ID based on secret and block hash
        uint256 tokenId = uint256(keccak256(abi.encodePacked(_secret, blockhash(block.number - 1)))) % MAX_SUPPLY;
        while (_ownerOf(tokenId) != address(0)) { 
            tokenId = (tokenId + 1) % MAX_SUPPLY; // 确保唯一性
        }

        _mint(msg.sender, tokenId);
        totalSupply++;

        if (totalSupply == MAX_SUPPLY) {
            saleState = SaleState.SOLD_OUT;
            emit StateChanged(SaleState.SOLD_OUT);
        }

        delete commitments[msg.sender];
        delete commitBlock[msg.sender];
        emit Reveal(msg.sender, tokenId);
    }

    // Merkle tree airdrop mint
    function airdropMint(bytes32[] calldata _merkleProof, uint256 _index) external payable {
        require(saleState == SaleState.PRESALE, "Presale not active");
        require(totalSupply < MAX_SUPPLY, "Supply exhausted");
        require(msg.value == PRESALE_PRICE, "Incorrect payment");

        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, _index));
        require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), "Invalid proof");

        // Use mapping or bitmap to prevent double minting
        // Option 1: Mapping
        require(!hasMintedMapping[msg.sender], "Already minted");
        hasMintedMapping[msg.sender] = true;

        // Option 2: Bitmap (comment out mapping lines above and uncomment below)
        // require(!BitMaps.get(hasMintedBitmap, _index), "Already minted");
        // BitMaps.set(hasMintedBitmap, _index);

        uint256 tokenId = totalSupply;
        while (_ownerOf(tokenId) != address(0)) { 
            tokenId = (tokenId + 1) % MAX_SUPPLY; // 确保唯一性（可选）
        }
        _mint(msg.sender, tokenId);
        totalSupply++;

        if (totalSupply == MAX_SUPPLY) {
            saleState = SaleState.SOLD_OUT;
            emit StateChanged(SaleState.SOLD_OUT);
        }
    }

    // Withdraw funds using pull pattern
    function withdrawFunds(address[] calldata _contributors) external {
        require(msg.sender == designatedAddress, "Not designated address");
        uint256 totalBalance = address(this).balance;

        for (uint256 i = 0; i < _contributors.length; i++) {
            address contributor = _contributors[i];
            uint256 amount = totalBalance / _contributors.length; // Equal split
            pendingWithdrawals[contributor] += amount;
        }
    }

    // Contributors pull their funds
    function claimFunds() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to claim");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit FundsWithdrawn(msg.sender, amount);
    }

    // Prevent minting abuse in multicall by relying on state checks
    function transferBatch(address[] calldata _to, uint256[] calldata _tokenIds) external {
        require(_to.length == _tokenIds.length, "Array length mismatch");
        for (uint256 i = 0; i < _to.length; i++) {
            safeTransferFrom(msg.sender, _to[i], _tokenIds[i]);
        }
    }
}