"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
// サーバー内のすべてのコマンドスレッドを取得するヘルパー関数
async function getAllCommandThreads(guild) {
    const commandThreads = [];
    // アクティブなスレッドを取得
    const activeThreads = await guild.channels.fetchActiveThreads();
    activeThreads.threads.forEach((thread) => {
        // 古い形式「〇〇 コマンドメモ」と新しい形式「コマンドメモN」の両方に対応
        if (thread.type === discord_js_1.ChannelType.GuildPublicThread &&
            (thread.name.endsWith(' コマンドメモ') || thread.name.startsWith('コマンドメモ'))) {
            commandThreads.push(thread);
        }
    });
    // 全チャンネルを走査し、アーカイブされたスレッドも追加
    const allChannels = await guild.channels.fetch();
    for (const [_, channel] of allChannels) {
        if (channel instanceof discord_js_1.TextChannel) {
            try {
                const archivedThreads = await channel.threads.fetchArchived();
                archivedThreads.threads.forEach((thread) => {
                    if (thread.type === discord_js_1.ChannelType.GuildPublicThread &&
                        (thread.name.endsWith(' コマンドメモ') || thread.name.startsWith('コマンドメモ'))) {
                        if (!commandThreads.find(t => t.id === thread.id)) {
                            commandThreads.push(thread);
                        }
                    }
                });
            }
            catch (err) {
                // アーカイブスレッド取得失敗時はスキップ
            }
        }
    }
    return commandThreads;
}
client.once('ready', () => {
    console.log('Bot is online!');
});
client.on('interactionCreate', async (interaction) => {
    // 全てのインタラクションをtry-catchでラップして、常に応答する
    try {
        let commandName;
        if (interaction.isChatInputCommand()) {
            commandName = interaction.commandName;
            if (commandName === 'addcommands') {
                // モーダルを作成
                const modal = new discord_js_1.ModalBuilder()
                    .setCustomId('addcommands-modal')
                    .setTitle('Minecraftコマンドを登録');
                // 名前用のテキスト入力
                const nameInput = new discord_js_1.TextInputBuilder()
                    .setCustomId('name')
                    .setLabel('コマンドの名前')
                    .setStyle(discord_js_1.TextInputStyle.Short)
                    .setRequired(true);
                // コマンド用のテキスト入力
                const commandInput = new discord_js_1.TextInputBuilder()
                    .setCustomId('command')
                    .setLabel('実際のMinecraftコマンド')
                    .setStyle(discord_js_1.TextInputStyle.Paragraph)
                    .setRequired(true);
                // 説明用のテキスト入力
                const descriptionInput = new discord_js_1.TextInputBuilder()
                    .setCustomId('description')
                    .setLabel('コマンドの説明')
                    .setStyle(discord_js_1.TextInputStyle.Paragraph)
                    .setRequired(true);
                // アクションローにテキスト入力を追加
                const firstActionRow = new discord_js_1.ActionRowBuilder().addComponents(nameInput);
                const secondActionRow = new discord_js_1.ActionRowBuilder().addComponents(commandInput);
                const thirdActionRow = new discord_js_1.ActionRowBuilder().addComponents(descriptionInput);
                // モーダルにアクションローを追加
                modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
                // モーダルを表示
                await interaction.showModal(modal);
            }
            else if (commandName === 'listcommands') {
                if (!interaction.guild) {
                    await interaction.reply({ content: 'サーバー内でのみ実行可能です。', ephemeral: true });
                    return;
                }
                const commandThreads = await getAllCommandThreads(interaction.guild);
                if (commandThreads.length === 0) {
                    await interaction.reply({ content: '登録されているコマンドはありません。', ephemeral: true });
                    return;
                }
                // 各スレッドからコマンドの詳細情報を取得してEmbedで一覧表示
                const listEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('登録されているMinecraftコマンド一覧')
                    .setTimestamp();
                // スレッドごとにフィールドを追加
                for (const thread of commandThreads) {
                    try {
                        // スレッド内のメッセージを取得してEmbedから情報を抽出
                        const messages = await thread.messages.fetch({ limit: 1 });
                        const firstMessage = messages.first();
                        if (firstMessage && firstMessage.embeds.length > 0) {
                            const commandEmbed = firstMessage.embeds[0];
                            const commandName = commandEmbed.title || thread.name.replace(' コマンドメモ', '');
                            const mcCommand = commandEmbed.fields?.find((f) => f.name === 'Minecraftコマンド')?.value || '不明';
                            const description = commandEmbed.fields?.find((f) => f.name === '説明')?.value || '不明';
                            listEmbed.addFields({
                                name: commandName,
                                value: `${mcCommand}\n説明: ${description}`
                            });
                        }
                        else {
                            // メッセージが取得できなかった場合はスレッド名だけ表示
                            const commandName = thread.name.includes(' コマンドメモ') ? thread.name.replace(' コマンドメモ', '') : thread.name;
                            listEmbed.addFields({ name: commandName, value: '詳細情報なし' });
                        }
                    }
                    catch (err) {
                        // メッセージ取得に失敗した場合もスレッド名だけ表示
                        const commandName = thread.name.includes(' コマンドメモ') ? thread.name.replace(' コマンドメモ', '') : thread.name;
                        listEmbed.addFields({ name: commandName, value: '詳細情報の取得に失敗しました' });
                    }
                }
                await interaction.reply({ embeds: [listEmbed], ephemeral: true });
            }
            else if (commandName === 'searchcommands') {
                if (!interaction.guild) {
                    await interaction.reply({ content: 'サーバー内でのみ実行可能です。', ephemeral: true });
                    return;
                }
                // 検索キーワードを入力するモーダルを表示
                const modal = new discord_js_1.ModalBuilder()
                    .setCustomId('searchcommand-modal')
                    .setTitle('コマンドを検索');
                const keywordInput = new discord_js_1.TextInputBuilder()
                    .setCustomId('keyword')
                    .setLabel('検索キーワード')
                    .setStyle(discord_js_1.TextInputStyle.Short)
                    .setRequired(true);
                const actionRow = new discord_js_1.ActionRowBuilder().addComponents(keywordInput);
                modal.addComponents(actionRow);
                await interaction.showModal(modal);
            }
            else if (commandName === 'deletecommands') {
                if (!interaction.guild) {
                    await interaction.reply({ content: 'サーバー内でのみ実行可能です。', ephemeral: true });
                    return;
                }
                // 古いコマンド定義でnameオプションが渡されても無視して、新しいセレクトメニュー処理を続行
                // オプションが存在しない場合もエラーにせず処理を続行する
                const commandThreads = await getAllCommandThreads(interaction.guild);
                if (commandThreads.length === 0) {
                    await interaction.reply({ content: '削除可能なコマンドが存在しません。', ephemeral: true });
                    return;
                }
                // 各スレッドからコマンド名を取得してセレクトメニューの選択肢を作成
                const selectOptions = [];
                for (const thread of commandThreads) {
                    try {
                        const messages = await thread.messages.fetch({ limit: 1 });
                        const firstMessage = messages.first();
                        if (firstMessage && firstMessage.embeds.length > 0) {
                            const commandEmbed = firstMessage.embeds[0];
                            const commandName = commandEmbed.title || thread.name.replace(' コマンドメモ', '');
                            selectOptions.push({
                                label: commandName,
                                value: thread.id // スレッドIDをvalueに使用して特定
                            });
                        }
                        else {
                            selectOptions.push({
                                label: thread.name.replace(' コマンドメモ', ''),
                                value: thread.id
                            });
                        }
                    }
                    catch (err) {
                        selectOptions.push({
                            label: thread.name.replace(' コマンドメモ', ''),
                            value: thread.id
                        });
                    }
                }
                // セレクトメニューを作成
                const selectMenu = new discord_js_1.StringSelectMenuBuilder()
                    .setCustomId('deletecommands-select')
                    .setPlaceholder('削除するコマンドを選択してください')
                    .addOptions(selectOptions);
                const actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                await interaction.reply({
                    content: '削除するコマンドを選択してください:',
                    components: [actionRow],
                    ephemeral: true
                });
            }
        }
        // セレクトメニューのインタラクションを処理
        if (interaction.isStringSelectMenu() && interaction.customId === 'deletecommands-select') {
            const threadIdToDelete = interaction.values[0];
            if (!interaction.guild) {
                // ギルド外では実行できないことを通知してメッセージを削除
                try {
                    await interaction.update({ content: 'サーバー内でのみ実行可能です。', components: [] });
                    setTimeout(async () => {
                        try {
                            await interaction.deleteReply();
                        }
                        catch { }
                    }, 2000);
                }
                catch {
                    // 失敗しても何もしない
                }
                return;
            }
            // スレッドIDで直接スレッドを取得して削除
            try {
                const targetThread = await interaction.guild.channels.fetch(threadIdToDelete).catch(() => null);
                if (targetThread) {
                    await targetThread.delete();
                    console.log(`スレッドID「${threadIdToDelete}」を削除しました。`);
                }
                else {
                    // アーカイブされている場合も検索して削除
                    const allChannels = await interaction.guild.channels.fetch();
                    let found = false;
                    for (const [_, channel] of allChannels) {
                        if (channel instanceof discord_js_1.TextChannel) {
                            try {
                                const archivedThreads = await channel.threads.fetchArchived();
                                const targetThreadArchived = archivedThreads.threads.find((thread) => thread.id === threadIdToDelete);
                                if (targetThreadArchived) {
                                    await targetThreadArchived.delete();
                                    console.log(`アーカイブ済みのスレッドID「${threadIdToDelete}」を削除しました。`);
                                    found = true;
                                    break;
                                }
                            }
                            catch (err) {
                                console.error('アーカイブスレッドの検索中にエラー:', err);
                                // エラーが発生しても処理を続行
                            }
                        }
                    }
                }
                // スレッド削除完了後、元のメッセージを更新して2秒後に削除
                await interaction.update({ content: 'コマンドを削除しました。', components: [] });
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply();
                    }
                    catch { }
                }, 2000);
            }
            catch (err) {
                console.error('スレッドの削除中にエラーが発生しました:', err);
                // エラーが発生した場合もメッセージを更新して2秒後に削除
                try {
                    await interaction.update({ content: 'スレッドの削除中にエラーが発生しました。', components: [] });
                    setTimeout(async () => {
                        try {
                            await interaction.deleteReply();
                        }
                        catch { }
                    }, 2000);
                }
                catch {
                    // 失敗しても何もしない
                }
            }
        }
        // モーダル送信のインタラクションを処理
        if (interaction.isModalSubmit() && interaction.customId === 'addcommands-modal') {
            try {
                const name = interaction.fields.getTextInputValue('name');
                const mcCommand = interaction.fields.getTextInputValue('command');
                const description = interaction.fields.getTextInputValue('description');
                // 同名のコマンドスレッドが既に存在するか確認
                if (interaction.guild) {
                    const existingThreads = await getAllCommandThreads(interaction.guild);
                    let exists = false;
                    // 過去の「コマンド名 コマンドメモ」形式と新しい「コマンドメモN」形式の両方をチェック
                    for (const thread of existingThreads) {
                        // 過去の形式の場合は名前でチェック
                        if (thread.name.includes(' コマンドメモ')) {
                            if (thread.name === `${name} コマンドメモ`) {
                                exists = true;
                                break;
                            }
                        }
                        else {
                            // 新しい形式の場合はスレッド内のEmbedからコマンド名を取得してチェック
                            try {
                                const messages = await thread.messages.fetch({ limit: 1 });
                                const firstMessage = messages.first();
                                if (firstMessage && firstMessage.embeds.length > 0) {
                                    const commandEmbed = firstMessage.embeds[0];
                                    if (commandEmbed.title === name) {
                                        exists = true;
                                        break;
                                    }
                                }
                            }
                            catch (err) {
                                console.error('スレッドのチェック中にエラーが発生しました:', err);
                                continue;
                            }
                        }
                    }
                    if (exists) {
                        await interaction.reply({ content: `コマンド「${name}」は既に存在します。`, ephemeral: true });
                        return;
                    }
                }
                // チャンネルに直接スレッドを作成して、メッセージの下にスレッドが表示されないようにする
                if (interaction.channel instanceof discord_js_1.TextChannel && interaction.guild) {
                    // 現在のコマンド数を取得して連番を生成
                    const existingThreads = await getAllCommandThreads(interaction.guild);
                    const nextNumber = existingThreads.length + 1;
                    const threadName = `コマンドメモ${nextNumber}`;
                    // チャンネルに直接スレッドを作成（startThreadWithoutMessageを使用）
                    const thread = await interaction.channel.threads.create({
                        name: threadName,
                        autoArchiveDuration: 60,
                        reason: `${name} コマンドの追加`,
                    });
                    // Embedを作成
                    const commandEmbed = new discord_js_1.EmbedBuilder()
                        .setColor(0x0099FF) // 青色
                        .setTitle(name)
                        .addFields({ name: 'Minecraftコマンド', value: `\`${mcCommand}\`` }, { name: '説明', value: description })
                        .setTimestamp();
                    // スレッド内にコマンドの詳細情報をEmbedで投稿
                    await thread.send({ embeds: [commandEmbed] });
                    // スレッドを即座にアーカイブしてアクティブなスレッドが溜まらないようにする
                    await thread.setArchived(true);
                    // ユーザーにだけ見えるephemeralメッセージで完了を通知
                    await interaction.reply({ content: `コマンド「${name}」を追加しました。`, ephemeral: true });
                }
                else {
                    // テキストチャンネルでない場合も応答する
                    await interaction.reply({ content: 'テキストチャンネル内でのみ実行可能です。', ephemeral: true });
                }
            }
            catch (err) {
                console.error('コマンド追加処理中にエラーが発生しました:', err);
                // エラーが発生しても必ず応答する
                if (!interaction.replied) {
                    await interaction.reply({ content: 'コマンドの追加中にエラーが発生しました。', ephemeral: true }).catch(() => { });
                }
            }
        }
        // 検索モーダルの送信を処理
        if (interaction.isModalSubmit() && interaction.customId === 'searchcommand-modal') {
            try {
                const keyword = interaction.fields.getTextInputValue('keyword').toLowerCase();
                if (!interaction.guild) {
                    await interaction.reply({ content: 'サーバー内でのみ実行可能です。', ephemeral: true });
                    return;
                }
                const commandThreads = await getAllCommandThreads(interaction.guild);
                if (commandThreads.length === 0) {
                    await interaction.reply({ content: '登録されているコマンドはありません。', ephemeral: true });
                    return;
                }
                // キーワードに一致するコマンドだけを抽出
                const matchedCommands = [];
                for (const thread of commandThreads) {
                    try {
                        const messages = await thread.messages.fetch({ limit: 1 });
                        const firstMessage = messages.first();
                        if (firstMessage && firstMessage.embeds.length > 0) {
                            const commandEmbed = firstMessage.embeds[0];
                            const commandName = (commandEmbed.title || '').toLowerCase();
                            const mcCommand = (commandEmbed.fields?.find((f) => f.name === 'Minecraftコマンド')?.value || '').toLowerCase();
                            const description = (commandEmbed.fields?.find((f) => f.name === '説明')?.value || '').toLowerCase();
                            // コマンド名、コマンド本文、説明のいずれかにキーワードが含まれていればマッチ
                            if (commandName.includes(keyword) || mcCommand.includes(keyword) || description.includes(keyword)) {
                                matchedCommands.push({
                                    name: commandEmbed.title,
                                    mcCommand: commandEmbed.fields?.find((f) => f.name === 'Minecraftコマンド')?.value,
                                    description: commandEmbed.fields?.find((f) => f.name === '説明')?.value
                                });
                            }
                        }
                    }
                    catch (err) {
                        console.error('スレッドの処理中にエラーが発生しました:', err);
                        continue;
                    }
                }
                // 検索結果をEmbedで表示
                const searchEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0x00FF99)
                    .setTitle(`検索キーワード「${keyword}」に一致するコマンド`)
                    .setTimestamp();
                if (matchedCommands.length === 0) {
                    searchEmbed.setDescription('一致するコマンドが見つかりませんでした。');
                }
                else {
                    for (const cmd of matchedCommands) {
                        searchEmbed.addFields({
                            name: cmd.name,
                            value: `${cmd.mcCommand}\n説明: ${cmd.description}`
                        });
                    }
                }
                await interaction.reply({ embeds: [searchEmbed], ephemeral: true });
            }
            catch (err) {
                console.error('検索処理中にエラーが発生しました:', err);
                // エラーが発生しても必ず応答する
                if (!interaction.replied) {
                    await interaction.reply({ content: '検索中にエラーが発生しました。', ephemeral: true }).catch(() => { });
                }
            }
        }
        // 全体のキャッチで、どんなエラーでも必ず応答
    }
    catch (globalErr) {
        console.error('インタラクション処理中に予期せぬエラーが発生しました:', globalErr);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '処理中にエラーが発生しました。しばらくしてから再度お試しください。',
                ephemeral: true
            }).catch(() => { });
        }
    }
});
client.login(process.env.DISCORD_TOKEN);
