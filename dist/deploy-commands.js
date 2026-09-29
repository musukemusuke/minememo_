"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
const commands_1 = require("./commands");
dotenv_1.default.config();
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
if (!token || !clientId) {
    console.error('DISCORD_TOKEN and CLIENT_ID must be provided in .env');
    process.exit(1);
}
const rest = new discord_js_1.REST({ version: '10' }).setToken(token);
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
client.once('ready', async () => {
    try {
        console.log('古いグローバルコマンドを全て削除中...');
        // 現在登録されている全てのグローバルコマンドを取得
        const currentGlobalCommands = await rest.get(discord_js_1.Routes.applicationCommands(clientId));
        // 全ての古いグローバルコマンドを削除
        for (const command of currentGlobalCommands) {
            await rest.delete(discord_js_1.Routes.applicationCommand(clientId, command.id));
            console.log(`古いグローバルコマンド「${command.name}」を削除しました (ID: ${command.id})`);
        }
        // Botが参加している全てのギルドにギルドコマンドを登録
        const guilds = client.guilds.cache;
        console.log(`Botが参加しているギルド数: ${guilds.size}`);
        for (const [guildId, guild] of guilds) {
            console.log(`ギルド「${guild.name}」(ID: ${guildId})にコマンドを登録中...`);
            const data = await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), { body: commands_1.commands });
            console.log(`ギルド「${guild.name}」に${data.length}個のコマンドを登録しました。`);
        }
        console.log('全てのギルドにコマンドの登録が完了しました。');
        process.exit(0);
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
});
client.login(token);
