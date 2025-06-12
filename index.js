const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require("discord.js");
const dotenv = require("dotenv");
const fs = require("fs-extra");
const path = require("path");

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

const PREFIX = "!";
const REGULAR_PACK_COST = 70;
const LEGEND_PACK_COST = 400;
const DAILY_COOLDOWN = 4 * 60 * 60 * 1000;

const DATA_DIR = path.join(__dirname, "data");
const currencyPath = path.join(DATA_DIR, "currency.json");
const inventoryPath = path.join(DATA_DIR, "inventory.json");
const dailyPath = path.join(DATA_DIR, "daily.json");
const marketplacePath = path.join(DATA_DIR, "marketplace.json");

async function loadJSON(filePath) {
  try {
    return await fs.readJson(filePath);
  } catch {
    await fs.outputJson(filePath, []);
    return [];
  }
}

async function loadJSONobj(filePath) {
  try {
    return await fs.readJson(filePath);
  } catch {
    await fs.outputJson(filePath, {});
    return {};
  }
}

let userCurrency = {};
let userInventory = {};
let userDailyCooldown = {};
let marketplaceListings = [];

async function saveAllData() {
  await Promise.all([
    fs.writeJson(currencyPath, userCurrency, { spaces: 2 }),
    fs.writeJson(inventoryPath, userInventory, { spaces: 2 }),
    fs.writeJson(dailyPath, userDailyCooldown, { spaces: 2 }),
    fs.writeJson(marketplacePath, marketplaceListings, { spaces: 2 }),
  ]);
}

const CHARACTERS = {
  Common: [
    { name: "Ronald", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382598855216070698/image_2025-06-12_015358940-removebg-preview.png", value: 1 },
    { name: "Greenshirt", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382598058935844945/image_2025-06-12_015044762-removebg-preview.png", value: 1 },
    { name: "Unpopular Opinion", image: "https://cdn.discordapp.com/attachments/1382476980271841292/1382601275585204315/L7egXP6Ab74brAIOdAAAAAElFTkSuQmCC.png", value: 1 },
  ],
  Uncommon: [
    { name: "Bert", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382591454152626317/image_2025-06-12_012433021-removebg-preview.png", value: 3 },
    { name: "Harvey", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382596533798834236/image_2025-06-12_014444476-removebg-preview.png", value: 3 },
    { name: "Mr Ingrata", image: "https://media.discordapp.net/attachments/1382576913389719553/1382592311594061856/IMG_4803.png", value: 3 },
    { name: "Ron", image: "https://cdn.discordapp.com/attachments/1382476980271841292/1382600869660332173/wP5repnBjkIhQAAAABJRU5ErkJggg.png", value: 3 },
    { name: "Grayson", image: "https://cdn.discordapp.com/attachments/1382476980271841292/1382600705642336359/image_2025-06-12_020115976-removebg-preview.png", value: 3 },
    { name: "Jacob", image: "https://media.discordapp.net/attachments/1382576913389719553/1382592311371759657/IMG_4804.png", value: 3 },
    { name: "Bank Robbery IOU", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382595405308493916/image_2025-06-12_014007668-removebg-preview.png", value: 3 },
  ],
  Rare: [
    { name: "Dad", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382578729691385856/image_2025-06-12_003352906-removebg-preview.png", value: 5 },
    { name: "Grandpa", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382595763338743880/image_2025-06-12_014141899-removebg-preview.png", value: 5 },
    { name: "Uncle", image: "https://cdn.discordapp.com/attachments/1382476980271841292/1382601794693107775/A0gXXXmHanAAAAAElFTkSuQmCC.png", value: 5 },
    { name: "Officer Leslie", image: "https://cdn.discordapp.com/attachments/1382476980271841292/1382602502113071185/Dr2wzoAAAAASUVORK5CYII.png", value: 5 },
  ],
  Legend: [
    { name: "Chase Bank Glitch", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382591026002268262/image_2025-06-12_012250875-removebg-preview.png", value: 15 },
    { name: "Jaden", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382576947892064338/Jadenw.png", value: 100, isJaden: true },
    { name: "Florida Man", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382578001249833062/Floridaman-dry.webp", value: 15 },
    { name: "Miguel", image: "https://i.imgur.com/4S7U5Tf.png", value: 15 },
  ],
  Secret: [
    { name: "donutello", image: "https://cdn.discordapp.com/avatars/664915501641891860/37970d4f3d28c6c4c9a80cdf85955005.png?size=1024", value: 50 },
  ],
};

function rarityColor(rarity) {
  switch (rarity) {
    case "Common": return "#AAAAAA";
    case "Uncommon": return "#1E90FF";
    case "Rare": return "#800080";
    case "Legend": return "#FFD700";
    case "Secret": return "#FF1493";
    default: return "#FFFFFF";
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRarityByCard(card) {
  for (const rarity of Object.keys(CHARACTERS)) {
    if (CHARACTERS[rarity].some(c => c.name === card.name)) return rarity;
  }
  return "Unknown";
}

function getRandomRarityRegular() {
  const roll = Math.random();
  if (roll <= 0.00002) return "Secret";
  if (roll <= 0.00004) return "Jaden";
  if (roll <= 0.03) return "Legend";
  if (roll <= 0.10) return "Rare";
  if (roll <= 0.40) return "Uncommon";
  return "Common";
}

function getRandomRarityLegend() {
  const roll = Math.random();
  if (roll <= 0.01) return "Jaden";
  return "Legend";
}

function pickCardRegular() {
  const rarity = getRandomRarityRegular();
  if (rarity === "Jaden") {
    return CHARACTERS.Legend.find(c => c.isJaden);
  } else if (rarity === "Secret") {
    return CHARACTERS.Secret[Math.floor(Math.random() * CHARACTERS.Secret.length)];
  } else {
    const list = CHARACTERS[rarity];
    return list[Math.floor(Math.random() * list.length)];
  }
}

function pickCardLegend() {
  const rarity = getRandomRarityLegend();
  if (rarity === "Jaden") {
    return CHARACTERS.Legend.find(c => c.isJaden);
  } else {
    const legendNoJaden = CHARACTERS.Legend.filter(c => !c.isJaden);
    return legendNoJaden[Math.floor(Math.random() * legendNoJaden.length)];
  }
}

function openRegularPack() {
  const cards = [];
  for (let i = 0; i < 3; i++) {
    cards.push(pickCardRegular());
  }
  return cards;
}

function openLegendPack() {
  const cards = [];
  cards.push(pickCardLegend());
  for (let i = 1; i < 3; i++) {
    cards.push(pickCardRegular());
  }
  return cards;
}

function canClaimDaily(userId) {
  if (!userDailyCooldown[userId]) return true;
  return Date.now() - userDailyCooldown[userId] >= DAILY_COOLDOWN;
}

function addCardToInventory(userId, card) {
  if (!userInventory[userId]) userInventory[userId] = [];
  userInventory[userId].push(card);
}

function removeCardsFromInventory(userId, cardName, amount) {
  if (!userInventory[userId]) return false;
  let removed = 0;
  for (let i = userInventory[userId].length - 1; i >= 0 && removed < amount; i--) {
    if (userInventory[userId][i].name.toLowerCase() === cardName.toLowerCase()) {
      userInventory[userId].splice(i, 1);
      removed++;
    }
  }
  return removed === amount;
}

async function loadAllData() {
  userCurrency = await loadJSONobj(currencyPath);
  userInventory = await loadJSONobj(inventoryPath);
  userDailyCooldown = await loadJSONobj(dailyPath);
  marketplaceListings = await loadJSON(marketplacePath);
}

function validateRarity(rarity) {
  return ["Common", "Uncommon", "Rare", "Legend", "Secret"].includes(rarity);
}

function getMarketplaceListingsByRarity(rarity) {
  return marketplaceListings.filter(l => l.rarity === rarity);
}

function paginate(array, page = 1, pageSize = 5) {
  const start = (page - 1) * pageSize;
  return array.slice(start, start + pageSize);
}

client.once("ready", async () => {
  await loadAllData();
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const [command, ...args] = message.content.trim().substring(PREFIX.length).split(/\s+/);
  const userId = message.author.id;

  switch (command.toLowerCase()) {
    case "balance": {
      const bal = userCurrency[userId] || 0;
      return message.channel.send(`${message.author}, you have **${bal}** coins.`);
    }

    case "daily": {
      if (!canClaimDaily(userId)) {
        const timeLeft = DAILY_COOLDOWN - (Date.now() - userDailyCooldown[userId]);
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return message.channel.send(`${message.author}, you can claim your daily reward again in ${hours}h ${minutes}m.`);
      }
      const reward = 100;
      userCurrency[userId] = (userCurrency[userId] || 0) + reward;
      userDailyCooldown[userId] = Date.now();
      await saveAllData();
      return message.channel.send(`${message.author}, you claimed your daily reward of **${reward}** coins!`);
    }

    case "openpack": {
      if (!userCurrency[userId] || userCurrency[userId] < REGULAR_PACK_COST) {
        return message.channel.send(`${message.author}, you need at least **${REGULAR_PACK_COST}** coins to open a regular pack.`);
      }
      userCurrency[userId] -= REGULAR_PACK_COST;
      const pack = openRegularPack();
      pack.forEach(card => addCardToInventory(userId, card));
      await saveAllData();

      for (const card of pack) {
        const rarity = card.isJaden ? "Legend" : getRarityByCard(card);
        const embed = new EmbedBuilder()
          .setTitle(`${rarity} Card - ${card.name}`)
          .setColor(rarityColor(rarity))
          .setImage(card.image)
          .setFooter({ text: " Regular Pack" });
        await message.channel.send({ embeds: [embed] });
        await delay(2000);
      }
      break;
    }

    case "legendpack": {
      if (!userCurrency[userId] || userCurrency[userId] < LEGEND_PACK_COST) {
        return message.channel.send(`${message.author}, you need at least **${LEGEND_PACK_COST}** coins to open a legend pack.`);
      }
      userCurrency[userId] -= LEGEND_PACK_COST;
      const pack = openLegendPack();
      pack.forEach(card => addCardToInventory(userId, card));
      await saveAllData();

      for (const card of pack) {
        const rarity = card.isJaden ? "Legend" : getRarityByCard(card);
        const embed = new EmbedBuilder()
          .setTitle(`${rarity} Card - ${card.name}`)
          .setColor("#FFD700")
          .setImage(card.image)
          .setFooter({ text: "🌟 Legend Pack" });
        await message.channel.send({ embeds: [embed] });
        await delay(2000);
      }
      break;
    }

    case "inventory": {
      const inv = userInventory[userId] || [];
      if (inv.length === 0) return message.channel.send(`${message.author}, your inventory is empty.`);

      const counts = {};
      inv.forEach(card => counts[card.name] = (counts[card.name] || 0) + 1);

      let desc = "";
      for (const [name, count] of Object.entries(counts)) {
        desc += `**${name}** x${count}\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s Card Inventory`)
        .setDescription(desc)
        .setColor("#00FF00");

      return message.channel.send({ embeds: [embed] });
    }

    case "trade": {
      const target = message.mentions.users.first();
      if (!target) return message.channel.send("Please mention a user to trade with.\nUsage: `!trade @user CardName amount`");
      const cardName = args[1];
      const amount = parseInt(args[2]);
      if (!cardName || isNaN(amount) || amount < 1) return message.channel.send("Usage: `!trade @user CardName amount`");

      const senderInv = userInventory[userId] || [];
      const senderCardCount = senderInv.filter(c => c.name.toLowerCase() === cardName.toLowerCase()).length;
      if (senderCardCount < amount) return message.channel.send("You don't have enough cards to trade.");

      const removed = removeCardsFromInventory(userId, cardName, amount);
      if (!removed) return message.channel.send("An error occurred removing cards.");

      if (!userInventory[target.id]) userInventory[target.id] = [];
      const cardTemplate = Object.values(CHARACTERS).flat().find(c => c.name.toLowerCase() === cardName.toLowerCase());
      for (let i = 0; i < amount; i++) {
        userInventory[target.id].push(cardTemplate);
      }

      await saveAllData();
      return message.channel.send(`${message.author} traded **${amount}** x **${cardName}** to ${target}.`);
    }

    case "leaderboard": {
      const sortedUsers = Object.entries(userCurrency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      let description = "";
      for (let i = 0; i < sortedUsers.length; i++) {
        const [id, coins] = sortedUsers[i];
        let tag = "Unknown User";
        try {
          const user = await client.users.fetch(id);
          tag = user.tag;
        } catch {}
        description += `**#${i + 1}** - ${tag} — **${coins} coins**\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle("🏆 Top 10 Richest Users")
        .setDescription(description || "No coin data available.")
        .setColor("#FFD700");

      return message.channel.send({ embeds: [embed] });
    }

    case "credits": {
      return message.channel.send("Made by ParkerXD24 he is so cool, also donutello helped");
    }

    case "secret": {
      const secretCards = CHARACTERS.Secret;
      if (!secretCards || secretCards.length === 0) {
        return message.channel.send("No secret cards available.");
      }
      const embed = new EmbedBuilder()
        .setTitle("Donutello is the GOAT🐐")
        .setColor(rarityColor("Secret"));

      let desc = "";
      secretCards.forEach(card => {
        desc += `**${card.name}**\n`;
      });

      embed.setDescription(desc);
      for (const card of secretCards) {
        embed.setImage(card.image);
        await message.channel.send({ embeds: [embed] });
        await delay(1500);
      }
      break;
    }


    case "listcard": {

      const cardName = args[0];
      const price = parseInt(args[1]);
      if (!cardName || isNaN(price) || price <= 0) {
        return message.channel.send("Usage: `!listcard <cardName> <price>` (price must be a positive number)");
      }
      const inv = userInventory[userId] || [];
      const cardIndex = inv.findIndex(c => c.name.toLowerCase() === cardName.toLowerCase());
      if (cardIndex === -1) return message.channel.send(`You don't have any "${cardName}" cards in your inventory.`);

      const card = inv.splice(cardIndex, 1)[0];
      userInventory[userId] = inv;


      const newListing = {
        id: marketplaceListings.length > 0 ? (marketplaceListings[marketplaceListings.length - 1].id + 1) : 1,
        sellerId: userId,
        card,
        price,
        rarity: getRarityByCard(card),
        createdAt: Date.now(),
      };
      marketplaceListings.push(newListing);
      await saveAllData();

      return message.channel.send(`Your **${card.name}** card has been listed for **${price}** coins on the marketplace. Listing ID: **${newListing.id}**`);
    }

    case "marketplace": {
      let filterRarity = null;
      let page = 1;
      if (args.length >= 1 && validateRarity(args[0])) {
        filterRarity = args[0];
        if (args.length >= 2) {
          const p = parseInt(args[1]);
          if (!isNaN(p) && p > 0) page = p;
        }
      } else if (args.length >= 1) {
        const p = parseInt(args[0]);
        if (!isNaN(p) && p > 0) page = p;
      }

      let listings = marketplaceListings;
      if (filterRarity) listings = listings.filter(l => l.rarity === filterRarity);

      if (listings.length === 0) {
        return message.channel.send("No marketplace listings found for the given filters.");
      }

      const PAGE_SIZE = 5;
      const totalPages = Math.ceil(listings.length / PAGE_SIZE);
      if (page > totalPages) page = totalPages;

      const pageListings = paginate(listings, page, PAGE_SIZE);

      const embed = new EmbedBuilder()
        .setTitle(`Marketplace Listings${filterRarity ? ` - ${filterRarity}` : ""} (Page ${page}/${totalPages})`)
        .setColor("#00FFFF")
        .setFooter({ text: "Use !buycard <listingId> to buy a card." });

      for (const listing of pageListings) {
        embed.addFields({
          name: `ID: ${listing.id} — ${listing.card.name} (${listing.rarity})`,
          value: `Price: **${listing.price}** coins\nSeller: <@${listing.sellerId}>`,
        });
      }

      return message.channel.send({ embeds: [embed] });
    }

    case "buycard": {
      
      const listingId = parseInt(args[0]);
      if (isNaN(listingId)) return message.channel.send("Usage: `!buycard <listingId>`");

      const listingIndex = marketplaceListings.findIndex(l => l.id === listingId);
      if (listingIndex === -1) return message.channel.send("Listing not found.");

      const listing = marketplaceListings[listingIndex];
      if (listing.sellerId === userId) return message.channel.send("You cannot buy your own listing.");

      const buyerCoins = userCurrency[userId] || 0;
      if (buyerCoins < listing.price) return message.channel.send("You don't have enough coins to buy this card.");

      
      userCurrency[userId] = buyerCoins - listing.price;
      userCurrency[listing.sellerId] = (userCurrency[listing.sellerId] || 0) + listing.price;

      if (!userInventory[userId]) userInventory[userId] = [];
      userInventory[userId].push(listing.card);

      
      marketplaceListings.splice(listingIndex, 1);

      await saveAllData();

      return message.channel.send(`${message.author} bought **${listing.card.name}** from <@${listing.sellerId}> for **${listing.price}** coins.`);
    }

    case "cancelcard": {
      
      const listingId = parseInt(args[0]);
      if (isNaN(listingId)) return message.channel.send("Usage: `!cancelcard <listingId>`");

      const listingIndex = marketplaceListings.findIndex(l => l.id === listingId);
      if (listingIndex === -1) return message.channel.send("Listing not found.");

      const listing = marketplaceListings[listingIndex];
      if (listing.sellerId !== userId) return message.channel.send("You can only cancel your own listings.");

      marketplaceListings.splice(listingIndex, 1);

      if (!userInventory[userId]) userInventory[userId] = [];
      userInventory[userId].push(listing.card);

      await saveAllData();

      return message.channel.send(`Your listing for **${listing.card.name}** has been canceled and the card returned to your inventory.`);
    }

    default:
      return;
  }
});

client.login(process.env.TOKEN);
