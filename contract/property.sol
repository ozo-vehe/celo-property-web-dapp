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
    uint public reStockFee = 1 ether;
    address payable owner;

    mapping(uint => Property) internal properties;
    
    struct Property {
      address payable owner;
      string name;
      string location;
      string description;
      string image;
      uint price;
      uint sold;
      uint stock;
    }

    modifier isValidIndex(uint _index){
      require(_index < propertyLength, "Enter a valid index");
      _;
    }

    constructor() {
      owner = payable(msg.sender);
    }
    function writeProperty(
      string memory _name,
      string memory _location,
      string memory _description,
      string memory _image,
      uint _price,
      uint _stock
    ) public {
      require(bytes(_name).length > 0, "Enter a valid name");
      require(bytes(_location).length > 0, "Enter a valid location");
      require(bytes(_description).length > 0, "Enter a valid description");
      if(bytes(_image).length == 0){
        _image = defaultImage;
      }
      require(_price > 0, "Enter a valid price");
      require(_stock > 0, "Enter a valid stock quantity");
      uint _sold = 0;
      properties[propertyLength] = Property(
        payable(msg.sender),
        _name,
        _location,
        _description,
        _image,
        _price,
        _sold,
        _stock
      );
      propertyLength ++;
    }

    function readProperty(uint _index) public view isValidIndex(_index) returns(Property memory) {
      Property memory currentProperty = properties[_index];
      return currentProperty;
    }

    function buyProperty(uint _index) public payable isValidIndex(_index){
        require(msg.sender != properties[_index].owner, "You can't buy your own property");
        require(properties[_index].stock > 0, "All properties of this index have been sold out");
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            properties[_index].owner,
            properties[_index].price
          ),
          "Transfer failed."
        );
        properties[_index].sold++;
        properties[_index].stock--;
    }

    function restock(uint _index, uint _stock) public payable isValidIndex(_index) {
      require(msg.sender == properties[_index].owner, "Only the owner is allowed to restock his properties");
      require(_stock > 0, "Enter a valid re stock amount");
      require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            owner,
            reStockFee
          ),
          "Transfer failed to restock property."
        );
      properties[_index].stock += _stock;
    }

    function getPropertyLength() public view returns (uint) {
      return (propertyLength);
    }
}
