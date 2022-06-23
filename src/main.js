import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import erc20Abi from "../contract/erc20.abi.json";
import propertyAbi from "../contract/property.abi.json";

const ERC20_DECIMALS = 18;
const propertyContractAddress = "0xc59d849591457B2a17ce729b52b005ffD924aeFF";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
const buyBtn = document.querySelector(".buy-btn");
const sellBtn = document.querySelector(".sell-btn");

let kit;
let contract;
let properties = [];

// BUY PROPERTY BUTTON
buyBtn.addEventListener("click", function () {
  const header = document.querySelector("header");
  const buyProperty = document.querySelector(".buy-property");
  header.classList.add("hide");
  buyProperty.classList.add("show");

  getStoredProperties();
});

// SELL PROPERTY BUTTON
sellBtn.addEventListener("click", function () {
  const header = document.querySelector("header");
  const sellProperty = document.querySelector(".sell-property");
  header.classList.add("hide");
  sellProperty.classList.add("show");
});

// NOTIFICATION
function notificationOn(notice) {
  const notificationText = document.querySelector(".notification h1");
  const notificationContainer = document.querySelector(".notification");
  notificationContainer.classList.replace("hide", "show");

  notificationText.textContent = notice;
}
function notificationOff() {
  const notificationContainer = document.querySelector(".notification");
  notificationContainer.classList.replace("show", "hide");
}

// DISPLAY AVAILABLE PROPERTIES
function availableProperties() {
  const displayProperty = document.querySelector(".display-property");
  displayProperty.innerHTML = "";
  properties.forEach((property) => {
    const newProperty = document.createElement("div");
    newProperty.className = "property";
    newProperty.innerHTML = propertyTemplate(property);

    displayProperty.appendChild(newProperty);
  });
}

// TEMPLATE FOR DISPLAY PROPERTIES
function propertyTemplate(property) {
  const buyBtn = 
  `<form id="${
    property.index
  }">
  <button type="submit" class="buy">Buy for ${property.price
    .shiftedBy(-ERC20_DECIMALS)
    .toFixed(2)} cUSD</button>
  </form>`;

  return `
    <div class="property-img">
      <img src="${property.image}" alt="Property">
      <p class="sold"> ${property.sold} Sold </p>
    </div>

    <div class="icon">
    ${identiconTemplate(property.owner)}
    </div>

    <div class="property-description">
      <h2>${property.name}</h2>
      <p>${reduceLength(property.description, 5, "...")}</p>
      <p class="property-location">${property.location}</p>
      ${kit.defaultAccount == property.owner ? "" : buyBtn}
    </div>
  `;
}

// IDENTICON TEMPLATE FOR USERS
function identiconTemplate(address) {
  const icon = blockies
    .create({
      seed: address,
      size: 8,
      scale: 16,
    })
    .toDataURL();

  return `
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${address}">
    </a>
  `;
}

// GET USER BALANCE
async function getUserBalance() {
  const balance = await kit.getTotalBalance(kit.defaultAccount);
  const cUSDBalance = balance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  const userBalance = `
    <p>Balance: ${cUSDBalance} cUSD</p>
  `;
  document.querySelector(".balance").innerHTML = userBalance;
}

// REDUCE PROPERTY DESCRIPTION
function reduceLength(sentence, maxLength, tail) {
  const words = sentence.split(" ");

  if (maxLength >= words.length) {
    return sentence;
  }

  const reducedSentence = words.slice(0, maxLength);
  return `${reducedSentence.join(" ")}${tail}`;
}

// GET STORED PROPERTIES
async function getStoredProperties() {
  const propertiesLength = await contract.methods.getPropertyLength().call();
  const propertyArray = [];

  for (let i = 0; i < propertiesLength; i++) {
    let newProperty = new Promise(async function (resolve, reject) {
      let storedProperty = await contract.methods.readProperty(i).call();

      resolve({
        index: i,
        owner: storedProperty[0],
        name: storedProperty[1],
        location: storedProperty[2],
        description: storedProperty[3],
        image: storedProperty[4],
        price: new BigNumber(storedProperty[5]),
        sold: storedProperty[6],
      });
      reject((err) => {
        notificationOn("Error: " + err);
      });
    });
    propertyArray.push(newProperty);
  }

  properties = await Promise.all(propertyArray);

  availableProperties();
}

// BUY PROPERTY
const buyPropertyContainer = document.querySelector(".buy-property");

buyPropertyContainer.addEventListener("submit", async function (e) {
  e.preventDefault();
  e.stopPropagation();
  const propertyIndex = e.target.id;

  notificationOn("Transaction in progress...");
  try {
    await purchaseApproval(properties[propertyIndex].price);
  } catch (error) {
    notificationOn("Error: " + error);
  }

  try {
    const result = await contract.methods
      .buyProperty(propertyIndex)
      .send({ from: kit.defaultAccount });

    notificationOn("Successfully bought " + properties[propertyIndex].name);
    properties[propertyIndex].sold++;
    getStoredProperties();
    getUserBalance();
    notificationOff();
  } catch (error) {
    notificationOn("Error " + error);
  }
});

// LOAD INITIAL INFO ABOUT USER AND CONTRACT
window.addEventListener("load", async function () {
  notificationOn("Loading user details, please wait...");
  await connectToWallet();
  await getUserBalance();
  getStoredProperties();
  notificationOff();
});

// CONNECTING TO THE CELO EXTENSION WALLET
async function connectToWallet() {
  if (window.celo) {
    notificationOn("Connecting to wallet...");

    try {
      await window.celo.enable();
      notificationOn("Connected!!!");

      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(
        propertyAbi,
        propertyContractAddress
      );
      notificationOff();
    } catch (error) {
      notificationOn(error);
    }
  } else {
    notificationOn("Please install the CeloExtensionWallet...");
  }
  notificationOff();
}

// USER APPROVAL FOR TRANSACTION
async function purchaseApproval(price) {
  notificationOn("Waiting for transaction approval...");
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress);

  const result = await cUSDContract.methods
    .approve(propertyContractAddress, price)
    .send({ from: kit.defaultAccount });

  notificationOn("Approved");
  return result;
}

// ADD NEW PROPERTY FROM FORM FILLED
const sellProperty = document.querySelector(".add-property");
sellProperty.addEventListener("click", async (e) => {
  e.preventDefault();

  notificationOn("Adding a new property...");

  const propertyName = document.querySelector(".property-name input");
  const propertyDesc = document.querySelector(".property-description input");
  const propertyLocation = document.querySelector(".property-location input");
  const propertyPrice = document.querySelector(".property-price input");
  const propertyImgUrl = document.querySelector(".property-img-url input");

  const params = [
    propertyName.value,
    propertyLocation.value,
    propertyDesc.value,
    propertyImgUrl.value,
    new BigNumber(propertyPrice.value).shiftedBy(ERC20_DECIMALS).toString(),
  ];

  notificationOn(`Adding "${params[0]}"...`);

  try {
    const result = await contract.methods
      .writeProperty(...params)
      .send({ from: kit.defaultAccount });

    notificationOn("Added");

    const buyProperty = document.querySelector(".buy-property");
    const sellProperty = document.querySelector(".sell-property");
    sellProperty.classList.replace("show", "hide");
    buyProperty.classList.add("show");
  } catch (error) {
    notificationOn(`${error}.`);
  }
  getStoredProperties();
  notificationOff();
});
