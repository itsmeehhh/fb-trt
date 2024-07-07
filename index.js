const { exec } = require('child_process');
const fs = require('fs')
const {Blob, FormData} = require('formdata-node')
const Tesseract = require('tesseract.js');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = 8080;
require('dotenv').config();
const Botly = require("botly");
const fetch = require("node-fetch");
const PageID = "208135635708754";
const { Sequelize } = require('sequelize');
const { Model, DataTypes } = require('sequelize');
/*--------- SQ database ---------*/
const sequelize = new Sequelize('database', 'user', 'pass', {
  dialect: 'sqlite',
  logging: false,
  host: './db.sqlite'
})
sequelize.sync();
class User extends Model {}
User.init({uid: {type: DataTypes.STRING}, lang: {type: DataTypes.STRING}}, {sequelize, modelName: 'users', timestamps: false}); 
/*--------- page database ---------*/
const botly = new Botly({
  accessToken: 'EAAIbNq4UZBmYBO9rGDCigMRCjymUEgVS5XRisajQrZCw4Wp6kOyhUUJDYUn50Mt5QDgtCyUEquPNSfC4R96uWls22dEQBGjoAZClTJZCyuGzwvRmSBYUHViofZC8aC8Dp3dZCQQFMiZB7ZByBytVBtALvZC74s72KEsM5P93UhwuMkXzdVsk2yeSZAeJJenEc16fCR',
  verifyToken: '12345678',
  webHookPath: process.env.WB_PATH,
  notificationType: Botly.CONST.REGULAR,
  FB_URL: "https://graph.facebook.com/v18.0/",
});
/*--------- Functions ---------*/
async function updateOrCreate (model, where, newItem) {
   const foundItem = await model.findOne({where});
   if (!foundItem) {
        const item = await model.create(newItem)
        return  {item, created: true};
    }
    const item = await model.update(newItem, {where});
    return {item, created: false};
}
/*--------- Functions ---------*/
app.get("/", function (_req, res) {
  res.sendStatus(200);
});
app.use(
  bodyParser.json({
    verify: botly.getVerifySignature('53e8aa7d20a4dd05c079f947d6d07643'),
  })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/webhook", botly.router());
botly.on("message", async (senderId, message, data) => {
  //aaaaaaaaaaaaa
  botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.MARK_SEEN});
  botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.TYPING_ON});

  /*--------- s t a r t ---------*/
  const user = await User.findOne({ where: { uid: senderId}});
  if (message.message.text) {
    if (user != null) {
      async function detectLanguage(text) {
        const response = await fetch(`https://api-trt-mopn.koyeb.app/translate.php?lang=default&text=${encodeURIComponent(text)}`);
        if (!response.ok) {
            throw new Error('Language detection failed');
        }
        const data = await response.json();
        return data.detect;
    }
              let originalText = message.message.text;

        // Detect language of original text
        try {
            const detectedLang = await detectLanguage(originalText);

            if (detectedLang === "en" || detectedLang === "fr" || detectedLang === `${user.dataValues.lang}`) {
                // trt auto to ar
                fetch(`https://api-trt-mopn.koyeb.app/translate.php?lang=ar&text=${encodeURIComponent(originalText)}`)
                    .then(response => response.json())
                    .then(data => {
                        botly.sendText({
                            id: senderId,
                            text: `${data.result}\n\n---------------\n تم استخدام الترجمة العكسية `,
                            quick_replies: [
                                botly.createQuickReply("إضغط لتغيير اللغة 🔁", "ChangeLang")
                            ]
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        botly.sendText({
                            id: senderId,
                            text: 'لم أتمكن من ترجمة هذا النص \n ربما النص طويل جدا او اذا لم يكن طويل اعد الارسال',
                            quick_replies: [
                                botly.createQuickReply("إضغط لتغيير اللغة 🔁", "ChangeLang")
                            ]
                        });
                    });
            } else {
                fetch(`https://api-trt-mopn.koyeb.app/translate.php?lang=${user.dataValues.lang}&text=${encodeURIComponent(originalText)}`)
                    .then(response => response.json())
                    .then(data => {
                        botly.sendText({
                            id: senderId,
                            text: data.result,
                            quick_replies: [
                                botly.createQuickReply("إضغط لتغيير اللغة 🔁", "ChangeLang")
                            ]
                        });
                    })
                    .catch(err => {
                        console.error(err);
                       botly.sendText({
                            id: senderId,
                            text: 'لم أتمكن من ترجمة هذا النص \n ربما النص طويل جدا او اذا لم يكن طويل اعد الارسال',
                            quick_replies: [
                                botly.createQuickReply("إضغط لتغيير اللغة 🔁", "ChangeLang")
                            ]
                        });
                    });
            }
        } catch (err) {
            console.error("Language detection error:", err);
          ////////////
          fetch(`https://api-trt-mopn.koyeb.app/translate.php?lang=${user.dataValues.lang}&text=${encodeURIComponent(originalText)}`)
                    .then(response => response.json())
                    .then(data => {
                        botly.sendText({
                            id: senderId,
                            text: data.result,
                            quick_replies: [
                                botly.createQuickReply("إضغط لتغيير اللغة 🔁", "ChangeLang")
                            ]
                        });
                    })
                    .catch(err => {
                        console.error(err);
                       botly.sendText({
                            id: senderId,
                            text: 'لم أتمكن من ترجمة هذا النص \n ربما النص طويل جدا او اذا لم يكن طويل اعد الارسال',
                            quick_replies: [
                                botly.createQuickReply("إضغط لتغيير اللغة 🔁", "ChangeLang")
                            ]
                        });
                    });
          ///////
        }
      } else {
        await User.create({ uid: senderId, lang: "en" });
        fetch(`https://api-trt-mopn.koyeb.app/translate.php?lang=en&text=${message.message.text}`)
        .then(response => response.json())
        .then(data => {
            botly.sendText({id: senderId, text: data.result,
            quick_replies: [
                botly.createQuickReply("إضغط لتغيير اللغة 🔁", "ChangeLang")]})
                }).catch(err => {console.error(err)});
      }
    } else if (message.message.attachments[0].payload.sticker_id) {
      botly.sendText({id: senderId, text: "(Y)"}) ;
    } else if (message.message.attachments[0].type == "image") {
        const attachment = message.message.attachments[0] 
        const images = attachment.payload.url;
      botly.sendText({id: senderId, text: "الميزة قيد التطوير \nانتظر قليلا😄⌛\nقد استغرق وقتا أطول لترجمة صورتك"});
    if (user != null) {
Tesseract.recognize(images, 'ara+eng+fra+deu+rus+ita+tur+kor+jpn+sqi+swe+hin+spa') 
      .then(result => {
const texts = result.data.text
 fetch(`https://api-trt-mopn.koyeb.app/translate.php?lang=${user.dataValues.lang}&text=${texts}`)
  .then(response => response.json())
  .then(data => {
      botly.sendText({id: senderId, text: data.result,
      quick_replies: [
          botly.createQuickReply("إضغط لتغيير اللغة 🔁", "ChangeLang")]})
          }).catch(err => {console.log(err)});})
    } else {
      await User.create({ uid: senderId, lang: "ar" });
Tesseract.recognize(images, 'ara+eng+fra+deu+rus+ita+tur+kor+jpn+sqi+swe+hin+spa') 
      .then(result => {
const texts = result.data.text
 fetch(`https://api-trt-mopn.koyeb.app/translate.php?lang=ar&text=${texts}`)
  .then(response => response.json())
  .then(data => {
      botly.sendText({id: senderId, text: data.result,
      quick_replies: [
          botly.createQuickReply("إضغط لتغيير اللغة 🔁", "ChangeLang")]})
          }).catch(err => {console.log(err)});})
    }
    } else if (message.message.attachments[0].type == "audio") {
      botly.sendText({id: senderId, text: "يمكنني ترجمة النصوص فقط 🥺"});
        } else if (message.message.attachments[0].type == "video") {
      botly.sendText({id: senderId, text: "يمكنني ترجمة النصوص فقط 🥺"});
    }
  /*--------- e n d ---------*/
//botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.TYPING_OFF}); 
});
botly.on("postback", async (senderId, message, postback, data, ref) => {
 //aaaaaaaaaa
  botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.MARK_SEEN});
  //aaaaaaaa
  botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.TYPING_ON});
    /*--------- s t a r t ---------*/
  const user = await User.findOne({ where: { uid: senderId}});
    if (message.postback){ // Normal (buttons)
    if (postback == "GET_STARTED"){
        if (user != null) {
          botly.sendText({id: senderId, text: "سعيد بلقائك مرة اخرى 😄\nانا مستعد لمساعدتك مجددا في الترجمة 😊"});
        } else {
            await User.create({ uid: senderId, lang: "en" });
            botly.sendGeneric({id: senderId, elements: {
                title: "سعيد بلقائك 😄\nانا هنا لمساعدتك في الترجمة 🥰",
                image_url: "https://telegra.ph/file/afae3cecb1be747aa78bf.png",
                subtitle: "انا روبوت للترجمة 😄، يمكنني الترجمة الى لغات متعددة ",
                buttons: [
                    botly.createPostbackButton("إبدأ الترجمة 🏁🌐", "ChangeLang"),
                  botly.createPostbackButton("مطور البوت 🇲🇦😄", "Owner"),
                ]}, aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL});
        }
    } else if (postback == "Owner") {
        botly.sendGeneric({id: senderId, elements: {
           title: "Morocco AI",
           image_url: "https://telegra.ph/file/6db48bb667028c068d85a.jpg",
           subtitle: "ولا تنسى متابعة الصفحة ❤️",
           buttons: [
              botly.createWebURLButton("صفحة المطور 🇲🇦😄", "https://www.facebook.com/profile.php?id=100090780515885")]},
            aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL});
       }  else if (postback == "ChangeLang"){
        botly.send({
            "id": senderId,
            "message": {
            "text": "اختر اللغة التي تريد الترجمة لها 🔁⚙️",
                "quick_replies":[
                {
                  "content_type":"text",
                  "title":"العربية 🇲🇦",
                  "payload":"ar",
                },{
                  "content_type":"text",
                  "title":"الفرنسية 🇫🇷",
                  "payload":"fr",
                },{
                  "content_type":"text",
                  "title":"الانجليزية 🇺🇸",
                  "payload":"en",
                },{
                  "content_type":"text",
                  "title":"الاسبانية 🇪🇸",
                  "payload":"es",
                },{
                  "content_type":"text",
                  "title":"الالمانية 🇩🇪",
                  "payload":"de",
                },{
                  "content_type":"text",
                  "title":"الروسية 🇷🇺",
                  "payload":"ru",
                },{
                  "content_type":"text",
                  "title":"الايطالية 🇮🇹",
                  "payload":"it",
                },{
                  "content_type":"text",
                  "title":"التركية 🇹🇷",
                  "payload":"tr",
                },{
                  "content_type":"text",
                  "title":"الكورية 🇰🇷",
                  "payload":"ko",
                },{
                  "content_type":"text",
                  "title":"الاندونيسية 🇮🇩",
                  "payload":"id",
                },{
                  "content_type":"text",
                  "title":"المزيد من اللغات 🔄",
                  "payload":"MoreLang",
                }
            ]
          }
          });
    } else if (postback == "MoreLang"){
        botly.send({
            "id": senderId,
            "message": {
              "text": "اختر اللغة التي تريد الترجمة لها 🔁⚙️",
                "quick_replies":[
                {
                  "content_type":"text",
                  "title":"الهندية 🇮🇳",
                  "payload":"hi",
                },{
                  "content_type":"text",
                  "title":"الالبانية 🇦🇱",
                  "payload":"sq",
                },{
                  "content_type":"text",
                  "title":"الصينية 🇨🇳",
                  "payload":"zh",
                },{
                  "content_type":"text",
                  "title":"الهولندية 🇳🇱",
                  "payload":"nl",
                },{
                  "content_type":"text",
                  "title":"الفلبينية 🇵🇭",
                  "payload":"fil",
                },{
                  "content_type":"text",
                  "title":"البنغلاديشية 🇧🇩",
                  "payload":"bn",
                },{
                  "content_type":"text",
                  "title":"اليابانية 🇯🇵",
                  "payload":"ja",
                },{
                  "content_type":"text",
                  "title":"البرتغالية 🇵🇹",
                  "payload":"pt",
                },{
                  "content_type":"text",
                  "title":"البلغارية 🇧🇬",
                  "payload":"bg",
                },{
                  "content_type":"text",
                  "title":"الأوكرانية 🇺🇦",
                  "payload":"uk",
                },{
                  "content_type":"text",
                  "title":"الرجوع للغات الاولى ↩️",
                  "payload":"ChangeLang",
                }
            ]
          }
          });
    } else if (postback == "tbs") {
        //
    } else if (postback == "bots") {
      botly.sendText({id: senderId, text: `قائمة روبوتاتنا 🇲🇦😍`,
      quick_replies: [
         botly.createQuickReply("Atlas-GPT", "Atlas-GPT")]});
    }
  } else { // Quick Reply
    if (message.message.text == "tbs") {
        //
    } else if (message.message.text == "tbs") {
      //
    }  else if (postback == "ChangeLang"){
        botly.send({
            "id": senderId,
            "message": {
            "text": "اختر اللغة التي تريد الترجمة لها 🔁⚙️",
                "quick_replies":[
                {
                  "content_type":"text",
                  "title":"العربية 🇲🇦",
                  "payload":"ar",
                },{
                  "content_type":"text",
                  "title":"الفرنسية 🇫🇷",
                  "payload":"fr",
                },{
                  "content_type":"text",
                  "title":"الانجليزية 🇺🇸",
                  "payload":"en",
                },{
                  "content_type":"text",
                  "title":"الاسبانية 🇪🇸",
                  "payload":"es",
                },{
                  "content_type":"text",
                  "title":"الالمانية 🇩🇪",
                  "payload":"de",
                },{
                  "content_type":"text",
                  "title":"الروسية 🇷🇺",
                  "payload":"ru",
                },{
                  "content_type":"text",
                  "title":"الايطالية 🇮🇹",
                  "payload":"it",
                },{
                  "content_type":"text",
                  "title":"التركية 🇹🇷",
                  "payload":"tr",
                },{
                  "content_type":"text",
                  "title":"الكورية 🇰🇷",
                  "payload":"ko",
                },{
                  "content_type":"text",
                  "title":"الاندونيسية 🇮🇩",
                  "payload":"id",
                },{
                  "content_type":"text",
                  "title":"المزيد من اللغات 🔄",
                  "payload":"MoreLang",
                }
            ]
          }
          });
    } else if (postback == "MoreLang"){
        botly.send({
            "id": senderId,
            "message": {
              "text": "اختر اللغة التي تريد الترجمة لها 🔁⚙️",
                "quick_replies":[
                {
                  "content_type":"text",
                  "title":"الهندية 🇮🇳",
                  "payload":"hi",
                },{
                  "content_type":"text",
                  "title":"الالبانية 🇦🇱",
                  "payload":"sq",
                },{
                  "content_type":"text",
                  "title":"الصينية 🇨🇳",
                  "payload":"zh",
                },{
                  "content_type":"text",
                  "title":"الهولندية 🇳🇱",
                  "payload":"nl",
                },{
                  "content_type":"text",
                  "title":"الفلبينية 🇵🇭",
                  "payload":"fil",
                },{
                  "content_type":"text",
                  "title":"البنغلاديشية 🇧🇩",
                  "payload":"bn",
                },{
                  "content_type":"text",
                  "title":"اليابانية 🇯🇵",
                  "payload":"ja",
                },{
                  "content_type":"text",
                  "title":"البرتغالية 🇵🇹",
                  "payload":"pt",
                },{
                  "content_type":"text",
                  "title":"البلغارية 🇧🇬",
                  "payload":"bg",
                },{
                  "content_type":"text",
                  "title":"الأوكرانية 🇺🇦",
                  "payload":"uk",
                },{
                  "content_type":"text",
                  "title":"الرجوع للغات الاولى ↩️",
                  "payload":"ChangeLang",
                }
            ]
          }
          });
    } else if (postback == "Owner") {
      botly.sendGeneric({id: senderId, elements: {
         title: "Morocco AI",
         image_url: "https://telegra.ph/file/6db48bb667028c068d85a.jpg",
         subtitle: "صفحة المطور 🇲🇦😄",
         buttons: [
            botly.createWebURLButton("مطور البوت 🇲🇦😍", "fb.com/Morocco.Openai")]},
          aspectRatio: Botly.CONST.IMAGE_ASPECT_RATIO.HORIZONTAL});
     } else {
      const languageMap = {
  "ar": "العربية 🇲🇦",
  "fr": "الفرنسية 🇫🇷",
  "en": "الإنجليزية 🇺🇸",
  "es": "الإسبانية 🇪🇸",
  "de": "الألمانية 🇩🇪",
  "ru": "الروسية 🇷🇺",
  "it": "الإيطالية 🇮🇹",
  "tr": "التركية 🇹🇷",
  "ko": "الكورية 🇰🇷",
  "id": "الإندونيسية 🇮🇩",
  "hi": "الهندية 🇮🇳",
  "sq": "الألبانية 🇦🇱",
  "zh": "الصينية 🇨🇳",
  "nl": "الهولندية 🇳🇱",
  "fil": "الفلبينية 🇵🇭",
  "bn": "البنغالية 🇧🇩",
  "ja": "اليابانية 🇯🇵",
  "pt": "البرتغالية 🇵🇹",
  "bg": "البلغارية 🇧🇬",
  "uk": "الأوكرانية 🇺🇦"
};

updateOrCreate(User, { uid: senderId }, { lang: postback })
  .then(function(result) {
    const languageName = languageMap[postback] || postback; // Get the full name and emoji, or fallback to the code
    botly.sendText({
      id: senderId,
      text: `تم تغيير اللغة ⚙️✅ \n\n ستتم الترجمة الى اللغة '${languageName}'\n\n ويمكنك أيضا ارسال نص باللغة '${languageName}' وسيتم ترجمته تلقائيا الى اللغة 'العربية 🇲🇦'`
    });
  });

     }
  }
   /*--------- e n d ---------*/
 //aaaaa
  botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.TYPING_OFF});
});
/*------------- RESP -------------*/
botly.setGetStarted({pageId: PageID, payload: "GET_STARTED"});
botly.setGreetingText({
    pageId: PageID,
    greeting: [
      {
        locale: "default",
        text: "مترجمي ❤️😄\nبوت يقدم خدمة الترجمة بين لغات مختلفة.\nسعداء باستخدامكم روبوتاتنا ❤️🇲🇦"
      },
      {
        locale: "ar_AR",
        text: "مترجمي ❤️😄\nبوت يقدم خدمة الترجمة بين لغات مختلفة.\nسعداء باستخدامكم روبوتاتنا ❤️🇲🇦"
      }
    ]
  });
botly.setPersistentMenu({
    pageId: PageID,
    menu: [
        {
          locale: "default",
          composer_input_disabled: false,
          call_to_actions: [
            {
              title:   "تغيير اللغة 🌐🔃",
              type:    "postback",
              payload: "ChangeLang"
            },{
              type:  "web_url",
              title: "صفحة المطور 🇲🇦😄",
              url:   "fb.com/Morocco.Openai/",
              webview_height_ratio: "full"
            }
          ]
        }
      ]
  });
/*------------- RESP -------------*/



//let serverLinkPrinted = false;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  /*const trySSH = () => {
    const serveoProcess = exec('ssh -tt -i "./0" -o StrictHostKeyChecking=no -R fb-trt:80:localhost:8080 serveo.net');

    serveoProcess.stdout.on('data', (data) => {
      const serveoLink = data.toString().trim();
      if (!serverLinkPrinted) {
        console.log(`Serveo link: ${serveoLink}`);
        serverLinkPrinted = true;
      }
    });

    serveoProcess.stderr.on('data', (data) => {
      const errorMessage = data.toString().trim();
      console.error(`stderr: ${errorMessage}`);
      const knownErrors = [
        "remote port forwarding failed for listen port 80",
        "client_loop: send disconnect: Broken pipe"
        //"ssh: connect to host serveo.net port 22: Connection refused"
      ];
      if (knownErrors.some(error => errorMessage.includes(error))) {
        console.log('Error detected, retrying...');
        serverLinkPrinted = false;
        serveoProcess.kill();
        trySSH();
      }
    });

    serveoProcess.on('close', (code) => {
      console.log(`Serveo process exited with code ${code}`);
    });
  };
 
  trySSH();*/
});
                      
