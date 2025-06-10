const fs = require("node:fs");
const cliColor = require("cli-color");
const package = require("./package.json");
const axios = require("axios");
const errorLogging = require("./handlers/errorLogging.js");

process.stdout.write(cliColor.reset);
if (fs.existsSync("logs.txt")) {
    if (!fs.existsSync("./logs")) fs.mkdirSync("./logs");
    fs.renameSync("logs.txt", `logs/${Date.now()}.txt`);
}

console.log(
    `    _${cliColor.blueBright.bold(`${cliColor.underline("Ptero")}dact${cliColor.underline("yl & P")}eli${cliColor.underline("can")}`)}___    ______   ______   \n` +
    `   /\\  ___\\  /\\__  _\\ /\\  __ \\  /\\__  _\\ /\\  ___\\  \n` +
    `   \\ \\___  \\ \\/_ \\ \\/ \\ \\ \\_\\ \\ \\/_/\\ \\/ \\ \\___  \\ \n` +
    `    \\/\\_____\\   \\ \\_\\  \\ \\_\\ \\_\\   \\ \\_\\  \\/\\_____\\ \n` +
    `     \\/_____/    \\/_/   \\/_/\\/_/    \\/_/   \\/_____/${cliColor.yellowBright.bold(`${package.version}`)}`
);

console.log(
    ` \nCopyright © 2022 - ${new Date().getFullYear()} HirziDevs & Contributors\n ` +
    " \nDiscord: https://discord.znproject.my.id" +
    " \n Source: https://github.com/HirziDevs/PteroStats" +
    " \nLicense: https://github.com/Hirzidevs/PteroStats/blob/main/LICENSE" +
    ` \n \n${package.description}\n `
);

axios.get("https://raw.githubusercontent.com/HirziDevs/PteroStats/refs/heads/main/package.json").then(response => {
    if (response.data && response.data.version !== package.version) console.log(
        cliColor.yellowBright(`+============================================================+\n`) +
        `              Update available: ${package.version} → ${cliColor.green(response.data.version)}\n` +
        `  Download at ${cliColor.blueBright("https://ps.znproject.my.id/download")} to update.\n` +
        cliColor.redBright(`   Make sure to backup ${cliColor.blueBright("config.yml")} and ${cliColor.blueBright(".env")} before updating.\n`) +
        cliColor.yellowBright(`+============================================================+`)
    )
}).catch(error => console.log(`${cliColor.cyanBright("[PteroStats]")} ${cliColor.redBright("Failed to check for updates.")}`));

// ✅ Load directly from .env if it exists; skip interactive setup
if (!fs.existsSync(".env")) {
    console.log(cliColor.redBright("Missing .env file! Please create it with all required variables."));
    process.exit(1);
}

// Continue normally even if .setup-complete is missing
require("dotenv").config();
require("./handlers/application.js")();

// Error handling
process.on('uncaughtException', (error) => errorLogging(error));
process.on('unhandledRejection', (error) => errorLogging(error));
