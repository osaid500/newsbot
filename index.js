const { driver } = require("@rocket.chat/sdk");
const { getRoomId } = require("@rocket.chat/sdk/dist/lib/driver");
require("dotenv").config();

const HOST = process.env.HOST_NAME;
const USER = process.env.USER_NAME;
const PASS = process.env.PASS_KEY;
let ROOMID;

const SSL = true; // server uses https ?
const ROOMS = [process.env.ROOM_NAME];
const TelegramBot = require("node-telegram-bot-api");

let loggedIn = false;
let callIt = true;
const delayTime = 1500;
const messagesQueue = [];
const { sendMessage } = driver;
const { sendToRoom } = driver;

// TELEGRAM TOKEN
const token = process.env.TOKEN_KEY;

const bot = new TelegramBot(token, { polling: true });

// CONNTECT TO ROCKET.CHAT WORKSPACE
const runbot = async () => {
  await driver.connect({ host: HOST, useSsl: SSL });
  await driver.login({ username: USER, password: PASS });
  await driver.joinRooms(ROOMS);
  ROOMID = await getRoomId(ROOMS[0]);
  await driver.subscribeToMessages();
  loggedIn = true;
};

// DETECT ANY MESSAGE IN TELEGRAM GROUPS
bot.on("message", (msg) => {
  if (!loggedIn) return;
  messagesQueue.push(msg);
  prepareMessage();
});

// DETECT ANY MESSAGE IN TELEGRAM CHANNELS
bot.on("channel_post", (msg) => {
  if (!loggedIn) return;
  messagesQueue.push(msg);
  prepareMessage();
});

// PREPARE TO SEND THE MESSAGE // DELAY WHEN THERE'S MULTIPLE REQUESTS
function prepareMessage() {
  if (callIt) {
    msg = messagesQueue[0];
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Sending your message to Rocket.Chat");
    sendToRocket(msg);
    callIt = false;
    setTimeout(() => {
      callIt = true;
      messagesQueue.shift();
      console.log(messagesQueue.length);
    }, delayTime);
  } else {
    setTimeout(() => {
      prepareMessage();
    }, delayTime);
  }
}

// SEND THE MESSAGE TO ROCKET.CHAT
async function sendToRocket(msg) {
  let isLarge;
  let attachments = {
    attachments: [{}],
  };
  let attachment = attachments.attachments[0];
  let msgContent = {
    msg: msg.caption,
    rid: ROOMID,
  };

  if (msg.photo) {
    if (!msg.photo[3]?.file_id) return;
    // MESSAGE HAS PHOTO

    isLarge = calculateSize(msg.photo);
    if (!isLarge) {
      let url = await bot.getFileLink(msg.photo[3].file_id);
      attachment.image_url = url;
    } else attachment.text = "PHOTO TOO LARGE TO SHARE HERE";
    await sendMessage({
      ...msgContent,
      ...attachments,
    });
  } else if (msg.video) {
    // MESSAGE HAS VIDEO

    isLarge = calculateSize(msg.video);
    if (!isLarge) {
      let videoUrl = await bot.getFileLink(msg.video.file_id);
      let fileName = videoUrl.slice(87);
      attachment.video_url = videoUrl;
      attachment.title = fileName;
    } else attachment.text = "VIDEO TOO LARGE TO SHARE HERE";
    await sendMessage({
      ...msgContent,
      ...attachments,
    });
  } else if (msg.document) {
    // MESSAGE HAS DOCUMENT

    isLarge = calculateSize(msg.document);
    if (!isLarge) {
      let fileUrl = await bot.getFileLink(msg.document.file_id);
      let fileName = msg.document.file_name;
      let fileType = msg.document.mime_type;
      let url;
      url =
        fileType === "image/jpeg"
          ? { image_url: fileUrl }
          : fileType === "video/mp4"
          ? { video_url: fileUrl }
          : { text: fileUrl };
      attachments = {
        attachments: [
          {
            ...url,
            title: fileName,
          },
        ],
      };
    } else attachment.text = "FILE TOO LARGE TO SHARE HERE";
    await sendMessage({
      ...msgContent,
      ...attachments,
    });
  } else {
    // TEXT ONLY
    await sendToRoom(msg.text, ROOMS[0]);
  }
}

function calculateSize(el) {
  return el.file_size / 1000000 > 20;
}

runbot();
