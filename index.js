const { create, ev, Client,} = require('@open-wa/wa-automate');
const { Client: DiscordClient, GatewayIntentBits: intents, EmbedBuilder } = require('discord.js')
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");
const clientDC = new DiscordClient({ intents: [

  intents.Guilds,
  intents.GuildMessages,
  intents.DirectMessages,
  
] });

const { 
  
  prefix, 
  number,
  apiKeyOpenAI,
  organizationOpenAI,
  initial,
  evalPrefix,
  discordKeyBot

} = require('./src/config/config.json');
//Mude as coisas dentro de config.json


const configuration = new Configuration({
    organization: organizationOpenAI,
    apiKey: apiKeyOpenAI,
});
const openai = new OpenAIApi(configuration);

ev.on('qr.**', async qrcode => {
  
  const imageBuffer = Buffer.from(
    qrcode.replace('data:image/png;base64,', ''),
    'base64'
  );
  const today = moment().format('YYYY-MM-DD');
  fs.writeFileSync(`qr_code_${today}.png`, imageBuffer);
});

async function startBot(client) {

    clientDC.login(discordKeyBot)
    console.clear()
    console.log(`[BOT]: Seu bot foi iniciado com sucesso` + '\n')
    clientDC.on('ready', () => console.log(`[BOT DISCORD]: Seu bot ${clientDC.user.tag} foi iniciado com sucesso` + '\n'))

    client.sendText(number, 'Estou online.')

    
    client.onMessage(async message => {

      if(message.body.toLowerCase().startsWith(`${prefix}foto `)) {
        const input = message.body.split(' ')[1]
        const profilePicUrl = await client.getProfilePicFromServer(input+'@c.us' || message.from);
        if (profilePicUrl) {
          const imageBuffer = await axios.get(profilePicUrl, { responseType: 'arraybuffer' });
          const base64Image = Buffer.from(imageBuffer.data, 'binary').toString('base64');
          const mimeType = imageBuffer.headers['content-type'];
          const dataUri = `data:${mimeType};base64,${base64Image}`;
          await client.sendImage(message.from, dataUri, 'profile-pic.jpeg', `Foto de perfil de ${input}`);
        } else {
          await client.reply(message.from, 'Esse contato não possui uma foto de perfil');
        }
      }


      if (message.body.trim().toLowerCase().startsWith(`${prefix}enquete`)) {
        console.log('Recebida mensagem de votação de ' + message.from);
      
        await client.reply(message.from, 'Qual nome você deseja?', message.id);
      
        const collector1 = client.createMessageCollector(
          message,
          (m) => m.from === message.from,
          { time: 5000, max: 1 }
        );
      
        collector1.on('collect', async (nameMessage) => {
          console.log('Recebida mensagem de nome de votação de ' + message.from);
          
          const namepoll = nameMessage.body.trim();
      
          if (namepoll.length >= 1) {
            console.log('Nome da votação: ' + namepoll);
      
            await client.reply(
              message.from,
              'Quais opções você deseja? Exemplo: pizza, x-tudo',
              message.id
            );
      
            const collector2 = client.createMessageCollector(
              nameMessage,
              (m) => m.from === message.from,
              { time: 5000, max: 1 }
            );
      
            collector2.on('collect', async (optMessage) => {
              console.log('Recebida mensagem de opções de votação de ' + message.from);
      
              const opt = optMessage.body
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
      
              if (opt.length >= 2) {
                console.log('Opções da votação: ' + opt);
      
                await client.sendPoll(message.from, namepoll, opt);
              } else {
                await client.reply(
                  message.from,
                  'Mínimo 2 opções são necessárias para a votação.',
                  message.id
                );
              }
            });
      
            collector2.on('end', async (collected, reason) => {
              if (reason === 'time') {
                await client.reply(
                  message.from,
                  'O tempo limite de 5 segundos para informar as opções acabou.',
                  message.id
                );
              }
            });
          }
        });
      
        collector1.on('end', async (collected, reason) => {
          if (reason === 'time') {
            await client.reply(
              message.from,
              'O tempo limite de 5 segundos para informar o nome da votação acabou.',
              message.id
            );
          }
        });
      }
      
      
      if (message.body.trim().toLowerCase().startsWith(`${prefix}discordmsg`)) {
        await client.reply(
          message.from,
          'Qual o discord Id que você deseja mandar uma mensagem?',
          message.id
        );
      
        const collector = client.createMessageCollector(
          message,
          (m) => m.from === message.from,
          {
            time: 50000,
            max: 1,
          }
        );
      
        collector.on('collect', async (firstMessage) => {
          if (firstMessage.body) {
            try {
              const id = await clientDC.users.fetch(firstMessage.body);
              await client.reply(
                firstMessage.from,
                'Qual mensagem você deseja enviar?',
                firstMessage.id
              );
      
              const msgCollector = client.createMessageCollector(
                message,
                (m) => m.from === firstMessage.from,
                {
                  time: 50000,
                  max: 1,
                }
              );
      
              msgCollector.on('collect', async (secondMessage) => {
                if (secondMessage.body) {

                  const profilePicUrl = await client.getProfilePicFromServer(message.from);
                  const embedMSG = new EmbedBuilder()
                  .setColor('Random')
                  .setTitle('Mensagem recebida')
                  .setDescription(secondMessage.body || ' ')
                  .setFooter({text: `Enviado de: ${message.from.replace('@c.us', '')}`, iconURL: profilePicUrl })

                  await id.send({embeds: [embedMSG]});
                  await client.reply(
                    secondMessage.from,
                    'Mensagem enviada com sucesso!',
                    secondMessage.id
                  );
                }
              });
      
              msgCollector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                  await client.reply(
                    firstMessage.from,
                    'O tempo limite de 50000 segundos para enviar a mensagem acabou.',
                    firstMessage.id
                  );
                }
              });
            } catch (error) {
              await client.reply(
                firstMessage.from,
                'O ID de usuário do Discord informado é inválido. Por favor, informe um ID de usuário válido.',
                firstMessage.id
              );
            }
          }
        });
      
        collector.on('end', async (collected, reason) => {
          if (reason === 'time') {
            await client.reply(
              message.from,
              'O tempo limite de 50 segundos para informar o ID acabou.',
              message.id
            );
          }
        });
      }
      
    
      if (message.body.toLowerCase().startsWith(`${evalPrefix}eval`)){

        if(message.from != number){

          return client.reply(message.from, 'Você não tem permissão para usar esse comando!', message.id)

        }else{

          try{

            const input = message.body.slice(6)
            const result = await eval(input)

            console.log(result)

            await client.reply(

              message.from,
              `Resultado:\n${JSON.stringify(result, null, ' ')}`,
              message.id

            )

          }catch(e){

            await client.reply(

              message.from,
              `Erro:\n${e.message}`,
              message.id

            )

          }

        }

      }


      if (message.type === 'image') {

        const image = await client.decryptMedia(message);
        const sticker = await client
        .sendImageAsSticker(

          message.from, 
          image,
          { 

            author: 'enzo#2907',
            keepScale:true,
            pack:'enzo#2907'

          },

          );

        client
        .react(message.id, '✔')

        console
        .log('[Sticker]: Criado com sucesso: ', sticker + '\n');
      
      }
      

      if (message.quotedMsg && message.quotedMsg.type === 'image') {
        
        const image = await client.decryptMedia(message.quotedMsg);
        const sticker = await client
        .sendImageAsSticker(

          message.from, 
          image,
          { 

            author: 'enzo#2907',
            keepScale:true,
            pack:'enzo#2907'
            
          },

          );
          
        client
        .react(message.id, '✔')

        console.
        log('[Sticker]: Criado com sucesso: ', sticker + '\n');
        
      }


      if (message.body.startsWith(initial)){

        if (message.type === 'image'){

          return console.log('Não trabalho com imagens')

        }

        const input = message.body.slice(initial.length)

        try{

          const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: input,
            temperature: 0,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0,
          });

          const output = response.data.choices[0].text.trim()

          client.sendText(message.from, output + "\n" + `\nCaracteres: ${output.length}/6547`)
          console.log('[PERGUNTA]: '+ input + '\n')
          console.log('[RESPOSTA]: '+ output + '\n')
          console.log('[USER]: '+message.from)

          client
          .react(message.id, '✔')

        }catch (error){

          console.error(error)
          client.sendText(

            message.from,
            'Ocorreu algum erro, tente novamente mais tarde!'

          )

        }

      }


      if (message.body.trim().toLowerCase().startsWith(`${prefix}criargrupo`)){

        await client.reply(
          message.from,
          'Qual nome você deseja?',
          message.id
        )

        const collector = client.createMessageCollector(
          message,
          (m) => m.from === message.from,
          { time: 5000, max: 1 }
        );

        collector.on('collect', async (nameMessage) => {

          const nameGroup = nameMessage.body

          if(nameGroup.length >= 1){

            await client.createGroup(nameGroup, message.from)
            .then((grupoc) => {
    
              client.sendText(grupoc.wid._serialized, 'Grupo criado!')
    
              client.reply(message.from,'Grupo criado!', message.id)
    
              client
              .react(message.id, '✔')
      
              console.log('[GRUPO]: '+'grupo criado'+'\n'+'[ID]: '+ grupoc.wid._serialized+'\n'+'[NOME]: '+nameGroup)
    
            }).catch((e) => {
    
              console.error(e)
    
            })

          }

        })

        collector.on('end', async (reason) => {

          if (reason === 'time') {
            await client.reply(
              message.from,
              'O tempo limite de 5 segundos para informar o nome da votação acabou.',
              message.id
            );
          }

        })


      }


      if (message.body.toLowerCase().startsWith(`${prefix}quitgroups`)) {

        if(message.from != number){

          return client.reply(message.from, 'Você não tem permissão para usar esse comando!', message.id)

        }else{

          const groups = await client.getAllGroups();
      

          for (const group of groups) {
            await client.leaveGroup(group.id)
            .then(async () => {

              await client.reply(message.from, 'Sai de todos os grupos.', message.id);

              client
              .react(message.id, '✔')

            })
          }
        }
      
      }


      if (message.body.toLowerCase().startsWith(`${prefix}deletechats`)) {

        if(message.from != number){

          return client.reply(message.from, 'Você não tem permissão para usar esse comando!', message.id)

        }else{

          const chats = await client.getAllChats();


          for (const chat of chats) {
            await client.deleteChat(chat.id)
          }
          client
          .react(message.id, '✔')
          console.log('Deletados')
        }


      
      }


      if (message.body.toLowerCase().startsWith(`${prefix}animesdodia`)) {
        
        const today = moment().format('YYYY-MM-DD');

      
        const url = `https://api.jikan.moe/v4/schedules?date=${today}`;


        const response = await axios.get(url);

        const data = response.data.data

        const maped = data
        .map(a => a.title)

            console.log(maped)

            client.reply(
              message.from, 
              `Lista de animes que serão lançados hoje: ` + today + '\n\n' + maped.join('\n'),
              message.id
              
              )
              client
              .react(message.id, '✔')
    

        
      }


      if (message.body.toLowerCase().startsWith(`${prefix}addgrupo `)) {

          const input = message.body.split(' ')[1]+'@c.us'

          client.addParticipant(message.from, input)

          client.reply(

            message.from,
            `Usuario adicionado com sucesso!`,
            message.id
  
          )
  
          console.log('[ADICIONADO]: '+input+'\n')


      }


      if (message.body.toLowerCase().startsWith(`${prefix}removergrupo `)) {

        const input = message.body.split(' ')[1]+'@c.us'

        client.removeParticipant(message.from, input)

        client.reply(

          message.from,
          `Usuario removido com sucesso!`,
          message.id

        )

        console.log('[REMOVIDO]: '+input+'\n')

      }


      if (message.body.toLowerCase().startsWith(`${prefix}promovergrupo `)) {

        const input = message.body.split(' ')[1]+'@c.us'

        client.promoteParticipant(message.from, input)

        client.reply(

          message.from,
          `Usuario promovido com sucesso!`,
          message.id

        )

        console.log('[PROMOVIDO]: '+input+'\n')

      } 


      if (message.body.toLowerCase().startsWith(`${prefix}rebaixargrupo `)) {

        const input = message.body.split(' ')[1]+'@c.us'

        client.demoteParticipant(message.from, input)

        client.reply(

          message.from,
          `Usuario rebaixado com sucesso!`,
          message.id

        )

        console.log('[REBAIXADO]: '+input+'\n')

      }


      if (message.body.toLowerCase().startsWith(`${prefix}help`)) {

        client.reply(

          message.from,
`Olá, essa é a lista de comandos que eu possuo:\n
*Chat GPT:*
${initial}sua pergunta - ex: ${initial}quanto é 2+2
Obs:explique o que deseja.

*Funções (Grupo):*
${prefix}criargrupo - o bot cria um grupo
${prefix}addgrupo "numero" - o bot adiciona um participante
${prefix}removergrupo "numero" - o bot remove um participante
${prefix}promovergrupo "numero" - o bot promove um participante
${prefix}rebaixargrupo "numero" - o bot rebaixa um participante

*Funções*
${prefix}discordmsg - o bot manda uma mensagem embed para quem você quiser no discord
${prefix}enquete - o bot faz uma enquete
${prefix}foto "numero" - o bot manda a foto do numero que você mandou

*Curiosidades:*
${prefix}animesdodia - o bot manda a lista de animes do dia

*Avançado:*
${prefix}quitgroups - o bot sai de todos os grupos
${prefix}deletechats - o bot deleta todos os chats
${evalPrefix}eval "comando" - testa os comandos da biblioteca @open-wa/wa-automate`,
          message.id

        )

        client
        .react(message.id, '❔')

      }


    })

  }

const ConfigApp = {

    useChrome: true,
    autoRefresh:true,
    cacheEnabled:false,
    session:'kkj',
  
}  

  
create(ConfigApp).then(client => startBot(client));

