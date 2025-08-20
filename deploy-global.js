const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];

// commands/<folder>/*.js 구조 순회
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
    }
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`Started refreshing (GLOBAL) ${commands.length} application (/) commands.`);

    // 글로벌 배포: 봇이 초대된 모든 서버에 공통 반영 (전파 지연 가능)
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log(`Successfully reloaded (GLOBAL) ${data.length} application (/) commands.`);
    console.log('※ 글로벌 반영은 최대 1시간 지연될 수 있습니다.');
  } catch (error) {
    console.error('Global deploy failed:', error);
  }
})();