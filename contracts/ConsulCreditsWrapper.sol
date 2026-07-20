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
 * 
 * This contract represents Consul Credits as a two-digit USD unit:
 * - 1 token = $1.00 USD
 * - Smallest unit = $0.01 USD (like USDC/USDT but with 2 decimals)
 * 
 * Designed for integration with the SOVR Oracle Ledger system.
 */
contract ConsulCreditsWrapper is ERC20, Ownable, Pausable, ReentrancyGuard {
    // ============================================
    // CONSTANTS - USD Denominated (2 decimals)
    // ============================================
    /// @notice Number of decimals for USD representation (2 = cents)
    uint8 public constant override decimals = 2;

    /// @notice Token name representing USD denomination
    string private constant TOKEN_NAME = "Consul USD";

    /// @notice Token symbol
    string private constant TOKEN_SYMBOL = "cUSD";

    // ============================================
    // STATE VARIABLES
    // ============================================
    /// @notice Address authorized to perform oracle mint/burn operations
    address public oracleIntegrator;

    // ============================================
    // EVENTS
    // ============================================
    event OracleIntegratorUpdated(address indexed oldIntegrator, address indexed newIntegrator);
    event EmergencyWithdraw(address indexed token, address indexed to, uint256 amount);

    // ============================================
    // CONSTRUCTOR
    // ============================================
    constructor(address initialOwner) 
        ERC20(TOKEN_NAME, TOKEN_SYMBOL) 
        Ownable(initialOwner) 
    {
        // Token initialized with 2 decimal places for USD representation
    }

    // ============================================
    // ORACLE INTEGRATOR MANAGEMENT
    // ============================================
    /**
     * @dev Sets the Oracle integrator address (only callable by owner)
     * @param newIntegrator Address authorized to mint/burn for Oracle Ledger sync
     */
    function setOracleIntegrator(address newIntegrator) external onlyOwner {
        address oldIntegrator = oracleIntegrator;
        oracleIntegrator = newIntegrator;
        emit OracleIntegratorUpdated(oldIntegrator, newIntegrator);
    }

    // ============================================
    // ORACLE MINT / BURN (USD Denominated)
    // ============================================
    /**
     * @dev Oracle Ledger integration - Mint consul credits (in USD cents)
     * @param to Address to mint credits to
     * @param amountCents Amount in USD cents (e.g., 100 = $1.00)
     * @param ledgerReference Reference for Oracle Ledger integration
     */
    function oracleMint(
        address to,
        uint256 amountCents,
        string calldata ledgerReference
    ) external whenNotPaused {
        require(msg.sender == oracleIntegrator, "Only Oracle integrator can mint");
        require(to != address(0), "Invalid recipient");
        require(amountCents > 0, "Amount must be positive");
        _mint(to, amountCents);
    }

    /**
     * @dev Oracle Ledger integration - Burn consul credits (in USD cents)
     * @param from Address to burn credits from
     * @param amountCents Amount in USD cents (e.g., 100 = $1.00)
     * @param ledgerReference Reference for Oracle Ledger integration
     */
    function oracleBurn(
        address from,
        uint256 amountCents,
        string calldata ledgerReference
    ) external whenNotPaused {
        require(msg.sender == oracleIntegrator, "Only Oracle integrator can burn");
        require(from != address(0), "Invalid address");
        require(amountCents > 0, "Amount must be positive");
        require(balanceOf(from) >= amountCents, "Insufficient balance");
        _burn(from, amountCents);
    }

    // ============================================
    // EMERGENCY FUNCTIONS
    // ============================================
    /**
     * @dev Pause all token operations (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token operations (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal of any ERC20 token stuck in the contract
     * @param token ERC-20 token address
     * @param to Destination address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token, 
        address to, 
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Invalid destination");
        if (token == address(0)) {
            // Withdraw native ETH
            payable(to).transfer(amount);
        } else {
            // Withdraw ERC20
            IERC20(token).transfer(to, amount);
        }
        emit EmergencyWithdraw(token, to, amount);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    /**
     * @dev Converts USD amount to token amount (with 2 decimals)
     * @param usdAmount Amount in USD (e.g., 1.00 = 100 cents)
     */
    function usdToTokenAmount(uint256 usdAmount) external pure returns (uint256) {
        return usdAmount; // Already in cents (2 decimals)
    }

    /**
     * @dev Converts token amount to USD amount
     */
    function tokenToUsdAmount(uint256 tokenAmount) external pure returns (uint256) {
        return tokenAmount;
    }
}
