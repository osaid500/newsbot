const { driver } = require("@rocket.chat/sdk");
const { getRoomId } = require("@rocket.chat/sdk/dist/lib/driver");
require("dotenv").config();

const HOST = process.env.HOST_NAME;
const USER = process.env.USER_NAME;
const PASS = process.env.PASS_KEY;
const ROOMID = process.env.ROOM_ID;

const SSL = true; // server uses https ?
const ROOMS = ["Dar-AlArqam"];

const TelegramBot = require("node-telegram-bot-api");

// TELEGRAM TOKEN
const token = process.env.TOKEN_KEY;

const bot = new TelegramBot(token, { polling: true });

// DETECT ANY MESSAGE IN TELEGRAM
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  sendMessage(msg);
  bot.sendMessage(chatId, "Received your message");
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
  if (msg.photo) {
    // MESSAGE HAS PHOTO
    let url = await bot.getFileLink(msg.photo[3].file_id);
    const sentMsg = await driver.sendMessage({
      msg: msg.caption,
      rid: ROOMID,
      attachments: [
        {
          image_url: url,
        },
      ],
    });
  } else {
    // TEXT ONLY
    const botmsg = await driver.sendToRoom(msg.text, ROOMS[0]);
  }
}

runbot();
