const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fetch = require("node-fetch");
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

const currencyPath = path.join(__dirname, "currency.json");
const inventoryPath = path.join(__dirname, "inventory.json");
const winsPath = path.join(__dirname, "wins.json");
const battlesPath = path.join(__dirname, "battles.json");
const battleStatsPath = path.join(__dirname, "battlestats.json");
const dailyPath = path.join(__dirname, "daily.json");
const marketplacePath = path.join(__dirname, "marketplace.json");


let userCurrency = {};
let userInventory = {};
let userDailyCooldown = {};
let userWins = {};
let battleStats = {};
let pendingBattles = {};
let marketplaceListings = [];

async function loadJSONobj(filePath) {
  try {
    return await fs.readJson(filePath);
  } catch {
    await fs.outputJson(filePath, {});
    return {};
  }
}

async function loadJSON(filePath, fallback = {}) {
  try {
    return await fs.readJson(filePath);
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err.message);
    console.warn("File was NOT reset to avoid data loss. Please check the file manually.");
    throw err;
  }
}

async function loadMarketplace() {
  const data = await loadJSON("marketplace.json", []);
  if (!Array.isArray(data)) {
    console.warn("Marketplace Resetting.");
    marketplaceListings = [];
    await saveMarketplace();
  } else {
    marketplaceListings = data;
  }
}

async function saveMarketplace() {
  await fs.writeJson("marketplace.json", marketplaceListings, { spaces: 2 });
}

function paginate(input, page = 1, pageSize = 5) {
  const array = Array.isArray(input) ? input : [];
  const start = (page - 1) * pageSize;
  return array.slice(start, start + pageSize);
}

async function loadAllData() {
  userCurrency = await loadJSON(currencyPath);
  userInventory = await loadJSON(inventoryPath);
  userDailyCooldown = await loadJSON(dailyPath);
  userWins = await loadJSON(winsPath);
  battleStats = await loadJSON(battleStatsPath);
  pendingBattles = await loadJSON(battlesPath);
  marketplaceListings = await loadJSON(marketplacePath, []);
}

async function saveAllData() {
  await Promise.all([
    fs.writeJson(currencyPath, userCurrency, { spaces: 2 }),
    fs.writeJson(inventoryPath, userInventory, { spaces: 2 }),
    fs.writeJson(dailyPath, userDailyCooldown, { spaces: 2 }),
    fs.writeJson(winsPath, userWins, { spaces: 2 }),
    fs.writeJson(battlesPath, pendingBattles, { spaces: 2 }),
    fs.writeJson(battleStatsPath, battleStats, { spaces: 2 }),
    fs.writeJson(marketplacePath, marketplaceListings, { spaces: 2 }),
  ]);
}

process.on("SIGINT", async () => {
  console.log(" Saving all data before shutdown...");
  await saveAllData();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log(" SIGTERM received. Saving data...");
  await saveAllData();
  process.exit(0);
});

process.on("uncaughtException", async (err) => {
  console.error(" Uncaught Exception:", err);
  await saveAllData();
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  console.error(" Unhandled Rejection:", reason);
  await saveAllData();
  process.exit(1);
});

client.once("ready", async () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
  await loadAllData();
});

async function saveBattleStats() {
  await fs.writeJson(battleStatsPath, battleStats, { spaces: 2 });
}
async function loadBattleStats() {
  battleStats = await loadJSONobj(battleStatsPath);
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
  await loadBattleStats();
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
const statuses = [
  "https://jadenw.com",
  "Use !help for command list.",
  "Made By ParkerXD24"
];

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  let index = 0;

  function setStatus() {
    client.user.setPresence({
      activities: [{ name: statuses[index], type: 3 }],
      status: "online"
    });
    index = (index + 1) % statuses.length;
  }

  setStatus();
  setInterval(setStatus, 10000);
});


client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const ALLOWED_CHANNEL_ID = "1383123492177707038";
  if (message.channel.id !== ALLOWED_CHANNEL_ID) {
    return message.channel.send("❌ Commands can only be used in the designated bot channel.");
  }

  const [command, ...args] = message.content.trim().substring(PREFIX.length).split(/\s+/);
  const userId = message.author.id;

  switch (command.toLowerCase()) {

case 'removecoins': {
  const ownerId = '1283897212069347489';

  if (message.author.id !== ownerId) {
    return message.reply("You don't have permission to use this command.");
  }

  const user = message.mentions.users.first();
  const amount = parseInt(args[1], 10);

  if (!user) {
    return message.reply("Please mention a user to remove coins from.");
  }

  if (isNaN(amount) || amount <= 0) {
    return message.reply("Please specify a valid amount of coins to remove.");
  }

  const userId = user.id;

  if (!userCurrency[userId]) {
    userCurrency[userId] = 0;
  }

  userCurrency[userId] = Math.max(userCurrency[userId] - amount, 0);

  fs.writeJson(currencyPath, userCurrency, { spaces: 2 })
    .then(() => {
      message.channel.send(`${amount} coins have been removed from ${user.username}. They now have ${userCurrency[userId]} coins.`);
    })
    .catch(err => {
      console.error(err);
      message.channel.send("Failed to save data.");
    });

  break;
}

case "credits": {
  const creditsEmbed = new EmbedBuilder()
    .setTitle("*** Bot Credits ***")
    .setColor("#ffcd05")
    .setThumbnail("https://cdn.discordapp.com/attachments/1382475319122067486/1382478295710564543/image.png")
    .addFields(
      { name: "*** Bot Designer ***", value: "ParkerXD24", inline: true },
      { name: "*** Bot Programmer ***", value: "ParkerXD24", inline: true },
      { name: "Extra Credit", value: "Donutello, itzjustjenn, and lechonk", inline: false },
      { name: "Special Thanks", value: "To, the1coolgamer For Hosting the Bot!", inline: false }
    )
    .setFooter({ text: ":)" })
    .setTimestamp();

  return message.channel.send({ embeds: [creditsEmbed] });
}


case "battle": {
  const opponent = message.mentions.users.first();
  const cardName = args.slice(1).join(" ");
  if (!opponent || opponent.bot || !cardName) {
    return message.channel.send("Usage: `!battle @user Card Name`");
  }

  const inv = userInventory[userId] || [];
  const hasCard = inv.find(c => c.name.toLowerCase() === cardName.toLowerCase());
  if (!hasCard) {
    return message.channel.send("You don't have that card in your inventory.");
  }

  const battleId = `${userId}_${opponent.id}`;
  if (pendingBattles[battleId]) {
    return message.channel.send("A battle request between you two is already pending.");
  }

  pendingBattles[battleId] = {
    challenger: userId,
    opponent: opponent.id,
    challengerCard: hasCard.name,
    timestamp: Date.now()
  };

  return message.channel.send(`${opponent}, ${message.author.username} challenged you with **${hasCard.name}**. Use \`!accept Card Name\` or \`!deny\`.`);
}


case "accept": {
  const opponentId = userId;
  const challengerEntry = Object.entries(pendingBattles).find(([key, b]) => b.opponent === opponentId);
  if (!challengerEntry) return message.channel.send("You have no pending battle requests.");

  const [battleKey, battle] = challengerEntry;
  const challengerId = battle.challenger;
  const challengerCardName = battle.challengerCard;

  const opponentCardName = args.join(" ");
  const opponentInv = userInventory[opponentId] || [];
  const opponentCardObj = opponentInv.find(c => c.name.toLowerCase() === opponentCardName.toLowerCase());

  if (!opponentCardObj) return message.channel.send("You don't have that card.");

  const challengerCardObj = Object.values(CHARACTERS).flat().find(c => c.name.toLowerCase() === challengerCardName.toLowerCase());
  const opponentCardFullObj = Object.values(CHARACTERS).flat().find(c => c.name.toLowerCase() === opponentCardName.toLowerCase());

  if (!challengerCardObj || !opponentCardFullObj) return message.channel.send("One of the cards could not be found in the card database.");

  const winnerId = Math.random() < 0.5 ? challengerId : opponentId;
  const loserId = winnerId === challengerId ? opponentId : challengerId;
  const winnerCard = winnerId === challengerId ? challengerCardName : opponentCardName;
  const loserCard = winnerId === challengerId ? opponentCardName : challengerCardName;

  const removed = removeCardsFromInventory(loserId, loserCard, 1);
  if (removed) {
    const cardObj = Object.values(CHARACTERS).flat().find(c => c.name === loserCard);
    addCardToInventory(winnerId, cardObj);
  }

  battleStats[winnerId] = battleStats[winnerId] || { wins: 0, losses: 0 };
  battleStats[loserId] = battleStats[loserId] || { wins: 0, losses: 0 };
  battleStats[winnerId].wins++;
  battleStats[loserId].losses++;

  delete pendingBattles[battleKey];
  await saveAllData();
  await saveBattleStats();

  const embed = new EmbedBuilder()
    .setTitle("⚔️ Battle Result")
    .setColor("#ff9900")
    .setDescription(`**${challengerCardObj.name}** (by <@${challengerId}>)\n🆚\n**${opponentCardFullObj.name}** (by <@${opponentId}>)`)
    .addFields({ name: "🏆 Winner", value: `<@${winnerId}> wins and takes **${loserCard}**!` })
    .setThumbnail(challengerCardObj.image)
    .setImage(opponentCardFullObj.image)
    .setFooter({ text: "Battle complete!" });

  return message.channel.send({ embeds: [embed] });
}


case "deny": {
  const opponentId = userId;
  const battleKey = Object.keys(pendingBattles).find(key => key.endsWith(`_${opponentId}`));
  if (!battleKey) return message.channel.send("You have no pending battle requests.");

  delete pendingBattles[battleKey];
  return message.channel.send("You denied the battle request.");
}

case "battlestats": {
  const target = message.mentions.users.first() || message.author;
  const stats = battleStats[target.id] || { wins: 0, losses: 0 };

  const embed = new EmbedBuilder()
    .setTitle(` Battle Stats for ${target.username}`)
    .setColor("#9b59b6")
    .addFields(
      { name: "🏆 Wins", value: `${stats.wins}`, inline: true },
      { name: "💀 Losses", value: `${stats.losses}`, inline: true }
    )
    .setFooter({ text: "Battle records are updated after each completed match." });

  return message.channel.send({ embeds: [embed] });
}



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
          { name: "!battle @user", value: "Challenge another user to a card battle." },
          { name: "!accept Card Name", value: "Accept a battle challenge." },
          { name: "!deny", value: "Decline a battle challenge." },
          { name: "!battlestats [@user]", value: "View your or someone else's win/loss record." },
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
  const userId = message.author.id;
  const coins = userCurrency[userId] || 0;

  const balanceEmbed = new EmbedBuilder()
    .setTitle(`${message.author.username}'s Balance`)
    .setDescription(`💰 You have **${coins}** coins.`)
    .setColor("#FFD700") 
    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  return message.channel.send({ embeds: [balanceEmbed] });
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

  const cardName = args.slice(1, -1).join(" ");
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

  let listings = Array.isArray(marketplaceListings) ? marketplaceListings : [];

 
  if (filterRarity) {
    listings = listings.filter(l => l.rarity === filterRarity);
  }

  if (listings.length === 0) {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(" No marketplace listings found for the given filters.")
          .setColor("#FFAA00")
      ]
    });
  }

  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  if (page > totalPages) page = totalPages;

  const pageListings = paginate(listings, page, PAGE_SIZE);

  const embed = new EmbedBuilder()
    .setTitle("🛒 Marketplace Listings")
    .setColor("#00BFFF")
    .setFooter({ text: `Page ${page} of ${totalPages}` });

  for (const listing of pageListings) {
    embed.addFields({
      name: `${listing.name} (${listing.rarity})`,
      value: `Seller: <@${listing.seller}>\nPrice: 💰 ${listing.price}`,
      inline: false
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
