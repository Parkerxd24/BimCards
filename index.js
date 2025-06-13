const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
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
    { name: "Landlord", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382841301497806991/AS7NSUglrWAAAAAElFTkSuQmCC.png", value: 3 },
    { name: "Lyles", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382841531505053779/BBraGyesxocAAAAASUVORK5CYII.png", value: 3 },
    { name: "Jicrosoft", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382842318582841374/AXtHU1z7G5fVoiYsCS8fAAAAAElFTkSuQmCC.png", value: 3 },
    { name: "Poor PC", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382842374912213143/JzchXngDjsvLEdmW2m3qARIcQX285UtRRUoa1ozVsmyNDisMqCchlGlkohiBkaHrccEx02FXhHe5asSPzkN1jd9vEHCVKmAAAAAElFTkSuQmCC.png", value: 3 },
    { name: "Vegan", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382842347200446706/TOC6LNi81e8AAAAASUVORK5CYII.png", value: 3 },
    { name: "Cashier", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382843269288955915/f79UJepmgFLC5IDb6fZQq1PTRNSQO4pP1h5vCnB9lprxc8y02LnHW5MXMxLcJ6o3CgRdlEPcD7YVrB6UyQM5AdWpXAAAAAElFTkSuQmCC.png", value: 3 },
    { name: "Andrew", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382849543170818188/P6YlbkuwiiPAAAAAElFTkSuQmCC.png", value: 3 },
  ],
  Uncommon: [
    { name: "Bert", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382591454152626317/image_2025-06-12_012433021-removebg-preview.png", value: 3 },
    { name: "M. Richards", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382847578248581120/UGP9rstlesVNR7dqC2wgCMlCrmZqko2Y2ynoguyaCuUrfJV93ZdNqfNfDbyi6Io3HyPNEDx3pRNYd1s2sAAAAASUVORK5CYII.png", value: 3 },
    { name: "Harvey", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382596533798834236/image_2025-06-12_014444476-removebg-preview.png", value: 3 },
    { name: "Mr Ingrata", image: "https://media.discordapp.net/attachments/1382576913389719553/1382592311594061856/IMG_4803.png", value: 3 },
    { name: "Backrooms Guy", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382841012342231212/sTl04jQFmSlpJUbAMZAgwIvVE8jU7i0sPpwIZVRsVTxepJWbfc2op0kt8Y3BkHJEhiIoafRXADKLo38vusXrs6776aX5pT9MRWTC5oh3G2yISgHAAAAAElFTkSuQmCC.png", value: 3 },
    { name: "Ron", image: "https://cdn.discordapp.com/attachments/1382476980271841292/1382600869660332173/wP5repnBjkIhQAAAABJRU5ErkJggg.png", value: 3 },
    { name: "Grayson", image: "https://cdn.discordapp.com/attachments/1382476980271841292/1382600705642336359/image_2025-06-12_020115976-removebg-preview.png", value: 3 },
    { name: "Jacob", image: "https://media.discordapp.net/attachments/1382576913389719553/1382592311371759657/IMG_4804.png", value: 3 },
    { name: "Bank Robbery IOU", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382595405308493916/image_2025-06-12_014007668-removebg-preview.png", value: 3 },
    { name: "Machine", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382842285963874355/w0JrPSHmaxHgAAAABJRU5ErkJggg.png", value: 3 },
    { name: "Mechanic", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382843620301738094/wN9vhADNq3nwAAAABJRU5ErkJggg.png", value: 3 },
    { name: "Secret Service", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382843651687845908/wcJJab1QMNPngAAAABJRU5ErkJggg.png", value: 3 },
    { name: "Breakdancer", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382846610899210280/ATgVcY4eQmTsAAAAAElFTkSuQmCC.png", value: 3 },
    { name: "Spare Change", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382847418982203402/UnUG6Fv4AAAAASUVORK5CYII.png", value: 3 },
    { name: "Fast Food Worker", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382847866040614912/f8AUcVfy6ixQMkAAAAASUVORK5CYII.png", value: 3 },
    { name: "Emperor", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382848478295625809/wHo7mXgiKxtAQAAAABJRU5ErkJggg.png", value: 3 },
    { name: "Reeve Carvey", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382850072462757888/G4ewOPWySlGMcRridWew4d9XaZz7GgxFJs7h3WGIrTnxvln54VrMR6AL78nSKehz3wSQJQOlsGwq7DLyHvffcK2wICUQJZOoEHNkaIjJ343AGn9Md2qjdzfe47yuEc4DvVepBi3TM7f1wrUdPTwjtdAAAAAElFTkSuQmCC.png", value: 3 },
  ],
  Rare: [
    { name: "Dad", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382578729691385856/image_2025-06-12_003352906-removebg-preview.png", value: 5 },
    { name: "Grandpa", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382595763338743880/image_2025-06-12_014141899-removebg-preview.png", value: 5 },
    { name: "Uncle", image: "https://cdn.discordapp.com/attachments/1382476980271841292/1382601794693107775/A0gXXXmHanAAAAAElFTkSuQmCC.png", value: 5 },
    { name: "Officer Leslie", image: "https://cdn.discordapp.com/attachments/1382476980271841292/1382602502113071185/Dr2wzoAAAAASUVORK5CYII.png", value: 5 },
    { name: "John", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382847052173672559/7PgvsZ48qS2IEiMAAAAASUVORK5CYII.png", value: 5 },
  ],
  Legend: [
    { name: "Chase Bank Glitch", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382591026002268262/image_2025-06-12_012250875-removebg-preview.png", value: 15 },
    { name: "Jaden", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382576947892064338/Jadenw.png", value: 100, isJaden: true },
    { name: "Florida Man", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382578001249833062/Floridaman-dry.webp", value: 15 },
    { name: "Miguel", image: "https://cdn.discordapp.com/attachments/1382476980271841292/1382807767085223946/wdaa_dada.png", value: 15 },
    { name: "3D Jaden", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382846080273879122/22YQPfnDgooUXrd6Y7yE8WloyESACROBHEyDBQ1cHESACRIAIEAEiQASIABEgAquWAAmeVXu0tDEiQASIABEgAkSACBABIkAESPDQNUAEiAARIAJEgAgQASJABIjAqiVAgmfVHi1tjAgQASJABIgAESACRIAIEAESPHQNEAEiQASIABEgAkSACBABIrBqCfwfnUeYVJ2NEYAAAAAASUVORK5CYII.png", value: 15 }
  ],
  Secret: [
    { name: "donutello", image: "https://cdn.discordapp.com/avatars/664915501641891860/37970d4f3d28c6c4c9a80cdf85955005.png?size=1024", value: 50 },
    { name: "Parker", image: "https://cdn.discordapp.com/attachments/1382576913389719553/1382845006586314774/wPn2b624cFMOQAAAABJRU5ErkJggg.png", value: 50 },
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


  client.user.setPresence({
    activities: [{ name: "https://jadenw.com Best Merch", type: 3 }],
    status: "online",
  });
});


client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const [command, ...args] = message.content.trim().substring(PREFIX.length).split(/\s+/);
  const userId = message.author.id;

  switch (command.toLowerCase()) {

case "chances": {
  const embed = new EmbedBuilder()
    .setTitle("📊 Pack Drop Chances")
    .setColor("#4CAF50")
    .setDescription("These are the base chances for pulling each rarity from packs.")
    .addFields(
      {
        name: "Regular Pack",
        value: [
          "Secret: **0.002%**",
          "Jaden: **0.002%**",
          "Legend: **3%**",
          "Rare: **7%**",
          "Uncommon: **30%**",
          "Common: **59.996%**"
        ].join("\n")
      },
      {
        name: "Legend Pack",
        value: [
          "Jaden: **1%**",
          "Legend (non-Jaden): **99%**"
        ].join("\n")
      }
    );

  return message.channel.send({ embeds: [embed] });
}


    case "characters": {
  const embed = new EmbedBuilder()
    .setTitle("📜 All Available Characters")
    .setColor("#FFA500")
    .setFooter({ text: "Characters grouped by rarity." });

  for (const [rarity, cards] of Object.entries(CHARACTERS)) {
    const names = cards.map(c => c.name).join(", ");
    embed.addFields({ name: `${rarity}`, value: names || "None", inline: false });
  }

  return message.channel.send({ embeds: [embed] });
}


    case "adminadd": {
      
      if (message.author.id !== "1283897212069347489") {
        return message.channel.send("You do not have permission to use this command.");
      }

      const target = message.mentions.users.first();
      const amount = parseInt(args[1]);

      if (!target || isNaN(amount) || amount <= 0) {
        return message.channel.send("Usage: `!adminadd @user <amount>`");
      }

      const targetId = target.id;
      userCurrency[targetId] = (userCurrency[targetId] || 0) + amount;

      await saveAllData();

      return message.channel.send(` Gave **${amount}** coins to ${target.tag}`);
    }


        case "help": {
      const embed = new EmbedBuilder()
        .setTitle("📖 Bot Command Help")
        .setColor("#00BFFF")
        .setDescription("Here are all available commands:")
        .addFields(
          { name: "!balance", value: "Check your coin balance." },
          { name: "!daily", value: "Claim your daily coin reward (every 4 hours)." },
          { name: "!openpack", value: `Open a Regular Pack (${REGULAR_PACK_COST} coins).` },
          { name: "!legendpack", value: `Open a Legend Pack (${LEGEND_PACK_COST} coins).` },
          { name: "!inventory", value: "View your card collection." },
          { name: "!characters", value: "View all the characters and their rarity!" },
          { name: "!trade @user CardName amount", value: "Trade cards with another user." },
          { name: "!leaderboard", value: "See the top 10 richest users." },
          { name: "!chances", value: "See the chances of each rarity." },
          { name: "!credits", value: "See who made the bot." },
          { name: "!secret", value: "Display secret cards." },
          { name: "!listcard <cardName> <price>", value: "List a card on the marketplace." },
          { name: "!marketplace [rarity] [page]", value: "Browse the marketplace with optional filters." },
          { name: "!buycard <listingId>", value: "Buy a card from the marketplace." },
          { name: "!cancelcard <listingId>", value: "Cancel your own listing." },
          { name: "!blackjack <amount>", value: "Play a game of blackjack and bet coins." },
          { name: "!roulette <amount> red|black", value: "Bet on red or black and spin the roulette." }
        )
        .setFooter({ text: "Use commands with the '!' prefix." });

      return message.channel.send({ embeds: [embed] });
    }

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
  const card = { name }; 
  const rarity = getRarityByCard(card);
  desc += `**${name}** (${rarity}) x${count}\n`;
}

      const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s Card Inventory`)
        .setDescription(desc)
        .setColor("#00FF00");

      return message.channel.send({ embeds: [embed] });
    }

case "trade": {
  const target = message.mentions.users.first();
  if (!target) {
    return message.channel.send("Please mention a user to trade with.\nUsage: `!trade @user <Card Name> <amount>`");
  }

  const amount = parseInt(args[args.length - 1]);
  if (isNaN(amount) || amount < 1) {
    return message.channel.send("Usage: `!trade @user <Card Name> <amount>`");
  }

  const cardName = args.slice(1, -1).join(" "); // Exclude mention and amount
  const senderInv = userInventory[userId] || [];
  const senderCardCount = senderInv.filter(c => c.name.toLowerCase() === cardName.toLowerCase()).length;

  if (senderCardCount < amount) {
    return message.channel.send("You don't have enough cards to trade.");
  }

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
      return message.channel.send("This bot was Designed and Coded Entirely By ParkerXD24, Credits: Donutello, itzjustjenn, and lechonk for the Pictures");
    }

    case "secret": {
      const secretCards = CHARACTERS.Secret;
      if (!secretCards || secretCards.length === 0) {
        return message.channel.send("No secret cards available.");
      }
      const embed = new EmbedBuilder()
        .setTitle("These are a Secret Don't tell Nobody")
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
  const price = parseInt(args[args.length - 1]);
  if (isNaN(price) || price <= 0) {
    return message.channel.send("Usage: `!listcard <card name> <price>` (price must be a positive number)");
  }

  const cardName = args.slice(0, -1).join(" ");
  const inv = userInventory[userId] || [];
  const cardIndex = inv.findIndex(c => c.name.toLowerCase() === cardName.toLowerCase());

  if (cardIndex === -1) {
    return message.channel.send(`You don't have any "${cardName}" cards in your inventory.`);
  }

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

    
    case "blackjack": {
      const bet = parseInt(args[0]);
      if (!bet || bet <= 0) return message.channel.send("Usage: `!blackjack <amount>`");
      if ((userCurrency[userId] || 0) < bet) return message.channel.send("You don't have enough coins.");

      const playerHand = [drawCard(), drawCard()];
      const dealerHand = [drawCard()];

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId("hit").setLabel("Hit").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("stand").setLabel("Stand").setStyle(ButtonStyle.Danger)
        );

      const embed = new EmbedBuilder()
        .setTitle("Blackjack")
        .setDescription(`Your hand: ${playerHand.join(", ")} (Total: ${getHandValue(playerHand)})\nDealer's visible card: ${dealerHand[0]}`)
        .setColor("#3498db");

      activeGames.set(userId, { bet, playerHand, dealerHand, row });

      return message.channel.send({ embeds: [embed], components: [row] });
    }


    case "roulette": {
      const bet = parseInt(args[0]);
      const guess = args[1]?.toLowerCase();
      if (!bet || bet <= 0 || !["red", "black"].includes(guess))
        return message.channel.send("Usage: `!roulette <amount> red|black`");

      if ((userCurrency[userId] || 0) < bet)
        return message.channel.send("You don't have enough coins to place that bet.");

      const outcome = Math.random() < 0.5 ? "red" : "black";
      const img = outcome === "red" ? "https://cdn.discordapp.com/attachments/1382576913389719553/1382834200037818438/D6TeyrO3jTo4AAAAAElFTkSuQmCC.png" : "https://cdn.discordapp.com/attachments/1382576913389719553/1382834200037818438/D6TeyrO3jTo4AAAAAElFTkSuQmCC.png";

      let resultMsg = `The wheel landed on **${outcome}**.`;
      if (guess === outcome) {
        userCurrency[userId] += bet;
        resultMsg += ` You won **${bet}** coins!`;
      } else {
        userCurrency[userId] -= bet;
        resultMsg += ` You lost **${bet}** coins.`;
      }

      await saveAllData();

      const embed = new EmbedBuilder()
        .setTitle("Roulette Result")
        .setDescription(resultMsg)
        .setImage(img)
        .setColor(outcome === "red" ? "#e74c3c" : "#2c3e50");

      return message.channel.send({ embeds: [embed] });
    }

    default:
      return;
  }
});

client.login(process.env.TOKEN);


const activeGames = new Map();

function getHandValue(hand) {
  let total = hand.reduce((a, b) => a + b, 0);
  let aces = hand.filter(c => c === 11).length;
  while (total > 21 && aces--) total -= 10;
  return total;
}

function drawCard() {
  const deck = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11];
  return deck[Math.floor(Math.random() * deck.length)];
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  const game = activeGames.get(interaction.user.id);
  if (!game) return;

  if (interaction.customId === "hit") {
    game.playerHand.push(drawCard());
    const playerTotal = getHandValue(game.playerHand);

    if (playerTotal > 21) {
      activeGames.delete(interaction.user.id);
      userCurrency[interaction.user.id] -= game.bet;
      await saveAllData();
      return interaction.update({
        content: `**Blackjack** - You drew a card.
Your hand: ${game.playerHand.join(", ")} (Total: ${playerTotal})
**BUST!** You lost **${game.bet}** coins.`,
        components: []
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("Blackjack")
      .setDescription(`Your hand: ${game.playerHand.join(", ")} (Total: ${playerTotal})
Dealer's visible card: ${game.dealerHand[0]}`);

    return interaction.update({
      embeds: [embed],
      components: [game.row]
    });

  } else if (interaction.customId === "stand") {
    let dealerTotal = getHandValue(game.dealerHand);
    while (dealerTotal < 17) {
      game.dealerHand.push(drawCard());
      dealerTotal = getHandValue(game.dealerHand);
    }

    const playerTotal = getHandValue(game.playerHand);
    let result = "";
    if (dealerTotal > 21 || playerTotal > dealerTotal) {
      result = `You win! You earned **${game.bet}** coins.`;
      userCurrency[interaction.user.id] += game.bet;
    } else if (playerTotal === dealerTotal) {
      result = `It's a draw! Your bet was returned.`;
    } else {
      result = `You lost **${game.bet}** coins.`;
      userCurrency[interaction.user.id] -= game.bet;
    }

    await saveAllData();
    activeGames.delete(interaction.user.id);

    return interaction.update({
      content: `**Blackjack**
Your hand: ${game.playerHand.join(", ")} (Total: ${playerTotal})
Dealer's hand: ${game.dealerHand.join(", ")} (Total: ${dealerTotal})
${result}`,
      components: []
    });
  }
});

});
