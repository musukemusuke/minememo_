import { SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('addcommands')
    .setDescription('Minecraftコマンドを登録します'),

  new SlashCommandBuilder()
    .setName('listcommands')
    .setDescription('登録されているMinecraftコマンドを一覧表示します'),

  new SlashCommandBuilder()
    .setName('deletecommands')
    .setDescription('登録されているMinecraftコマンドを削除します'),

  new SlashCommandBuilder()
    .setName('searchcommands')
    .setDescription('Minecraftコマンドをキーワードで検索します'),
].map(command => command.toJSON());