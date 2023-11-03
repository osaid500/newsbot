const { driver } = require("@rocket.chat/sdk");
const { getRoomId } = require("@rocket.chat/sdk/dist/lib/driver");
require("dotenv").config();

const HOST = process.env.HOST_NAME;
const USER = process.env.USER_NAME;
const PASS = process.env.PASS_KEY;
const ROOMID = process.env.ROOM_ID;

const SSL = true; // server uses https ?
const ROOMS = [process.env.ROOM_NAME];

const TelegramBot = require("node-telegram-bot-api");

// TELEGRAM TOKEN
const token = process.env.TOKEN_KEY;

const bot = new TelegramBot(token, { polling: true });

function callBot(msg) {
  const chatId = msg.chat.id;
  sendMessage(msg);
  bot.sendMessage(chatId, "Sending your message to Rocket.Chat");
}

// DETECT ANY MESSAGE IN TELEGRAM GROUPS
bot.on("message", (msg) => {
  callBot(msg);
});

// DETECT ANY MESSAGE IN TELEGRAM CHANNELS
bot.on("channel_post", (msg) => {
  callBot(msg);
});

var myuserid;

// CONNTECT TO ROCKET.CHAT WORKSPACE
const runbot = async () => {
  const conn = await driver.connect({ host: HOST, useSsl: SSL });
  myuserid = await driver.login({ username: USER, password: PASS });
  const roomsJoined = await driver.joinRooms(ROOMS);
  const joinedRoom = await getRoomId(ROOMS[0]);
  const subscribed = await driver.subscribeToMessages();
};

async function sendMessage(msg) {
  // SENDING MESSAGE
  console.log("sending message");
  console.log(msg);
  if (msg.photo) {
    // MESSAGE HAS PHOTO
    let url = await bot.getFileLink(msg.photo[3].file_id);
    const sentMsg = await driver.sendMessage({
      msg: msg.caption,
      rid: ROOMID,
      file: {
        type: "mp4,",
      },
      attachments: [
        {
          image_url: url,
        },
      ],
    });
  } else if (msg.video) {
    // MESSAGE HAS VIDEO
    let videoUrl = await bot.getFileLink(msg.video.file_id);
    let fileName = videoUrl.slice(87);
    const sentMsg = await driver.sendMessage({
      msg: msg.caption,
      rid: ROOMID,
      attachments: [
        {
          video_url: videoUrl,
          thumb_url: thumbUrl,
          title: fileName,
        },
      ],
    });
  } else if (msg.document) {
    // MESSAGE HAS DOCUMENT
    let fileUrl = await bot.getFileLink(msg.document.file_id);
    let fileName = msg.document.file_name;
    let fileType = msg.document.mime_type;
    console.log(fileType.slice(0, -4));
    let shrek;
    shrek =
      fileType === "image/jpeg"
        ? { image_url: fileUrl }
        : fileType === "video/mp4"
        ? { video_url: fileUrl }
        : { text: fileUrl };
    const sentMsg = await driver.sendMessage({
      msg: msg.caption,
      rid: ROOMID,
      attachments: [
        {
          ...shrek,
          title: fileName,
        },
      ],
    });
  } else {
    // TEXT ONLY
    const botmsg = await driver.sendToRoom(msg.text, ROOMS[0]);
  }
}

runbot();
