const { create, Client, ev } = require('@open-wa/wa-automate');
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");

const { 

  prefix, 
  number,
  apiKeyOpenAI,
  organizationOpenAI

} = require('./src/config/config')

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
  fs.writeFileSync('qr_code.png', imageBuffer);
});

function startBot(client) {

    console.clear()
    console.log('[BOT]: Seu bot foi iniciado com sucesso'+ '\n')

    client.onMessage(async message => {

      if (message.type === 'image') {

        const image = await client.decryptMedia(message);
        const sticker = await client
        .sendImageAsSticker(

          message.from, 
          image,
          { 

            author: '',
            keepScale:true,
            pack:''

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

            author: '',
            keepScale:true,
            pack:''
            
          },

          );
          
        client
        .react(message.id, '✔')

        console.
        log('[Sticker]: Criado com sucesso: ', sticker + '\n');
        
      }


      if(message.body.startsWith(initial)){

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

          client
          .react(message.id, '✔')

        }catch (error){

          console.error(error)

        }

      }


      if(message.body.toLowerCase().startsWith(`${prefix}criargrupo`)){

        await client.createGroup(message.from, message.from)
        .then((grupoc) => {

          client.sendText(grupoc.wid._serialized, 'Grupo criado!')

          client.reply(message.from,'Grupo criado!', message.id)

          client
          .react(message.id, '✔')
  
          console.log('[GRUPO]: '+'grupo criado'+'\n'+'[ID]: '+grupoc.wid._serialized)

        }).catch((e) => {

          console.error(e)

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
            .then(async () => {

              await client.reply(message.from, 'Deletei todos os chats.', message.id);
  
              client
              .react(message.id, '✔')

            })
          }
        }


      
      }


      if (message.body.toLowerCase().startsWith(`${prefix}animesdodia`)) {
        
        const today = moment().format('YYYY-MM-DD');

      
        const url = `https://api.jikan.moe/v4/schedules?date=${today}`;


        const response = await axios.get(url);

        const data = response.data.data

        const maped = data
        .map(a => a.title)

            client.reply(
              message.from, 
              `Lista de animes que serão lançados hoje: ` + today + '\n\n' + maped.join('\n'),
              message.id
              
              )
    

        
      }


    })

  }

const ConfigApp = {

    useChrome: true,
    autoRefresh:true,
    cacheEnabled:false,
    session:'kkj'
  
}  

  
create(ConfigApp).then(client => startBot(client));

