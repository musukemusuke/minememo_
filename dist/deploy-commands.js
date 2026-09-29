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
const guildId = process.env.DISCORD_GUILD_ID;
if (!token || !clientId) {
    console.error('DISCORD_TOKEN and DISCORD_CLIENT_ID must be provided in .env');
    process.exit(1);
}
const rest = new discord_js_1.REST({ version: '10' }).setToken(token);
(async () => {
    try {
        console.log('古いコマンドを全て削除中...');
        // 現在登録されている全てのコマンドを取得
        const currentCommands = guildId
            ? await rest.get(discord_js_1.Routes.applicationGuildCommands(clientId, guildId))
            : await rest.get(discord_js_1.Routes.applicationCommands(clientId));
        // 全ての古いコマンドを削除
        for (const command of currentCommands) {
            if (guildId) {
                await rest.delete(discord_js_1.Routes.applicationGuildCommand(clientId, guildId, command.id));
            }
            else {
                await rest.delete(discord_js_1.Routes.applicationCommand(clientId, command.id));
            }
            console.log(`古いコマンド「${command.name}」を削除しました (ID: ${command.id})`);
        }
        console.log(`新しいコマンドを${commands_1.commands.length}個登録中...`);
        // 新しいコマンドを登録
        const data = (guildId)
            ? await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), { body: commands_1.commands })
            : await rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: commands_1.commands });
        console.log(`正常に${data.length}個のコマンドを再登録しました。`);
    }
    catch (error) {
        console.error(error);
    }
})();
