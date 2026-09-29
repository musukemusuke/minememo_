import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { commands } from './commands';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error('DISCORD_TOKEN and DISCORD_CLIENT_ID must be provided in .env');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('古いグローバルコマンドを全て削除中...');
    
    // 現在登録されている全てのグローバルコマンドを取得
    const currentCommands: any = await rest.get(Routes.applicationCommands(clientId));
    
    // 全ての古いコマンドを削除
    for (const command of currentCommands) {
      await rest.delete(Routes.applicationCommand(clientId, command.id));
      console.log(`古いコマンド「${command.name}」を削除しました (ID: ${command.id})`);
    }

    console.log(`新しいグローバルコマンドを${commands.length}個登録中...`);

    // グローバルコマンドとして新しいコマンドを登録
    const data: any = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log(`正常に${data.length}個のグローバルコマンドを再登録しました。`);
  } catch (error) {
    console.error(error);
  }
})();