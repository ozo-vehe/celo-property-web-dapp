// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract BuyBuildings {

    string internal defaultImage = "https://images.adsttc.com/media/images/5f56/6397/b357/65bb/f900/0044/slideshow/Palma_Litib%C3%BA-8.jpg?1599497085";
    uint internal propertyLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    address internal owner ;

    mapping(uint => Property) internal properties;

    struct Property {
      address payable owner;
      string name;
      string location;
      string description;
      string image;
      uint price;
      uint sold;
      bool flagged;
    }

    modifier onlyOwner {
      require(msg.sender == owner);
      _;
    }

    constructor(address _owner) public {
      owner = _owner;
    }

    function writeProperty(
      string memory _name,
      string memory _location,
      string memory _description,
      string memory _image,
      uint _price
    ) public {

        require(_price > 0, "Enter a valid price");
      uint _sold = 0;
      properties[propertyLength] = Property(
        payable(msg.sender),
        _name,
        _location,
        _description,
        _image,
        _price,
        _sold
      );
      propertyLength ++;
    }

    function readProperty(uint _index) public view returns(
      address payable,
      string memory,
      string memory,
      string memory,
      string memory,
      uint,
      uint
    ) {
      return(
        properties[_index].owner,
        properties[_index].name,
        properties[_index].location,
        properties[_index].description,
        properties[_index].image,
        properties[_index].price,
        properties[_index].sold
      );
    }

    function buyProperty(uint _index) public payable  {
        require(properties[_index].flagged == false, "Product is flagged");
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            properties[_index].owner,
            properties[_index].price
          ),
          "Transfer failed."
        );
        properties[_index].sold++;
    }

    function getPropertyLength() public view returns (uint) {
      return (propertyLength);
    }

    function flagProperty(uint _index) public onlyOwner {
      properties[_index].flagged = true;
    }

    function unFlagProperty(uint _index) public onlyOwner {
      properties[_index].flagged = false;
    }

    function getFlaggedProperty(uint _index) public view returns (bool) {
      return (properties[_index].flagged);
    }


}
