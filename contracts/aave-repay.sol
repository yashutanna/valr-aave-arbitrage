// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

interface IAaveLendingPool {
    function repay(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    ) external returns (uint256);
}

contract Expenses {
    address public owner;
    address public payOnBehalfOf;
    address public lendingPool;
    mapping(string => address) public tokenAddresses;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner{
       require(owner == msg.sender,"caller is not owner");
        _;
    }

    modifier validPayOnBehalfOf {
       require(payOnBehalfOf != address(0), "payOnBehalfOf not set");
        _;
    }

    function setTokenAddress(string memory tokenSymbol, address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        tokenAddresses[tokenSymbol] = address(tokenAddress);
    }

    function setPayableOnBehalfOf(address _payOnBehalfOf) external onlyOwner {
        payOnBehalfOf = _payOnBehalfOf;
    }

    function setLendingPool(address _lendingPoolAddress) external onlyOwner {
        lendingPool = address(_lendingPoolAddress);
    }

    function repayLoan(string memory tokenSymbol, uint256 rateMode) external onlyOwner validPayOnBehalfOf {
        address token = tokenAddresses[tokenSymbol];
        require(token != address(0), "Token address not set for provided token");
        require(lendingPool != address(0), "Lending pool address not set");

        IERC20 erc20Token = IERC20(token);

        // Get the balance of the token on the contract
        uint256 balance = erc20Token.balanceOf(address(this));
        require(balance > 0, "Insufficient token balance");

        // Approve the LendingPool to transfer tokens
        require(
            erc20Token.approve(address(lendingPool), balance),
            "Token approval failed"
        );

        // Repay the loan
        uint256 repaidAmount = IAaveLendingPool(lendingPool).repay(
            token,
            balance,
            rateMode,
            payOnBehalfOf
        );

        require(repaidAmount > 0, "Repayment failed");
    }

    function withdrawAllEth() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }


    function withdraw(address token) external onlyOwner {
        IERC20 erc20Token = IERC20(token);
        uint256 balance = erc20Token.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");

        require(
            erc20Token.transfer(owner, balance),
            "Transfer failed"
        );
    }

}
