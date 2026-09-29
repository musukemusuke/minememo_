"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const discord_js_1 = require("discord.js");
exports.commands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('addcommand')
        .setDescription('Minecraftコマンドを登録します'),
    new discord_js_1.SlashCommandBuilder()
        .setName('listcommands')
        .setDescription('登録されているMinecraftコマンドを一覧表示します'),
    new discord_js_1.SlashCommandBuilder()
        .setName('deletecommand')
        .setDescription('登録されているMinecraftコマンドを削除します'),
    new discord_js_1.SlashCommandBuilder()
        .setName('searchcommands')
        .setDescription('Minecraftコマンドをキーワードで検索します'),
].map(command => command.toJSON());
