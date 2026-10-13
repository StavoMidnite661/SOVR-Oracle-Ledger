// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ConsulCreditsWrapper
 * @dev USD-denominated stablecoin-style token with 2 decimal places (cents)
 *      Augmented with On-Chain Proof-of-Solvency Merkle Attestations
 * 
 * - 1 token = $1.00 USD
 * - Smallest unit = $0.01 USD (2 decimals)
 * - Cryptographic Solvency Proofs anchored directly on Base L2
 */
contract ConsulCreditsWrapper is ERC20, Ownable, Pausable, ReentrancyGuard {
    // ============================================
    // CONSTANTS - USD Denominated (2 decimals)
    // ============================================
    uint8 public constant override decimals = 2;
    string private constant TOKEN_NAME = "Consul USD";
    string private constant TOKEN_SYMBOL = "cUSD";

    // ============================================
    // STATE VARIABLES
    // ============================================
    address public oracleIntegrator;

    struct SolvencyEpoch {
        bytes32 merkleRoot;
        uint256 totalAssetsCents;
        uint256 totalLiabilitiesCents;
        uint256 timestamp;
        uint256 entryCount;
    }

    /// @notice History of published cryptographic solvency epochs
    SolvencyEpoch[] public solvencyEpochs;

    // ============================================
    // EVENTS
    // ============================================
    event OracleIntegratorUpdated(address indexed oldIntegrator, address indexed newIntegrator);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);
    event SolvencyEpochAttested(
        uint256 indexed epochIndex,
        bytes32 indexed merkleRoot,
        uint256 totalAssetsCents,
        uint256 totalLiabilitiesCents,
        uint256 timestamp
    );

    // ============================================
    // CONSTRUCTOR
    // ============================================
    constructor(address initialOwner) 
        ERC20(TOKEN_NAME, TOKEN_SYMBOL) 
        Ownable(initialOwner) 
    {}

    // ============================================
    // ORACLE INTEGRATOR MANAGEMENT
    // ============================================
    function setOracleIntegrator(address newIntegrator) external onlyOwner {
        address oldIntegrator = oracleIntegrator;
        oracleIntegrator = newIntegrator;
        emit OracleIntegratorUpdated(oldIntegrator, newIntegrator);
    }

    // ============================================
    // ORACLE MINT / BURN (USD Denominated)
    // ============================================
    function oracleMint(
        address to,
        uint256 amountCents,
        string calldata ledgerReference
    ) external whenNotPaused {
        require(msg.sender == oracleIntegrator || msg.sender == owner(), "Unauthorized minter");
        require(to != address(0), "Invalid recipient");
        require(amountCents > 0, "Amount must be positive");
        _mint(to, amountCents);
    }

    function oracleBurn(
        address from,
        uint256 amountCents,
        string calldata ledgerReference
    ) external whenNotPaused {
        require(msg.sender == oracleIntegrator || msg.sender == owner(), "Unauthorized burner");
        require(from != address(0), "Invalid address");
        require(amountCents > 0, "Amount must be positive");
        require(balanceOf(from) >= amountCents, "Insufficient balance");
        _burn(from, amountCents);
    }

    // ============================================
    // PROOF-OF-SOLVENCY ON-CHAIN MERKLE ATTESTATION
    // ============================================
    /**
     * @notice Publishes a cryptographic Merkle root summarizing general ledger solvency
     */
    function publishAuditEpoch(
        bytes32 merkleRoot,
        uint256 totalAssetsCents,
        uint256 totalLiabilitiesCents,
        uint256 entryCount
    ) external whenNotPaused {
        require(msg.sender == oracleIntegrator || msg.sender == owner(), "Unauthorized attester");
        require(merkleRoot != bytes32(0), "Invalid Merkle root");

        solvencyEpochs.push(SolvencyEpoch({
            merkleRoot: merkleRoot,
            totalAssetsCents: totalAssetsCents,
            totalLiabilitiesCents: totalLiabilitiesCents,
            timestamp: block.timestamp,
            entryCount: entryCount
        }));

        emit SolvencyEpochAttested(
            solvencyEpochs.length - 1,
            merkleRoot,
            totalAssetsCents,
            totalLiabilitiesCents,
            block.timestamp
        );
    }

    function getEpochCount() external view returns (uint256) {
        return solvencyEpochs.length;
    }

    // ============================================
    // EMERGENCY FUNCTIONS
    // ============================================
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(
        address token, 
        address to, 
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Invalid destination");
        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).transfer(to, amount);
        }
        emit EmergencyWithdraw(token, to, amount);
    }
}
