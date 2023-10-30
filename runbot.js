const { driver } = require("@rocket.chat/sdk");
const axios = require("axios");
const {
  HOST,
  SSL,
  myuserid,
  USER,
  PASS,
  ROOMS,
  processMessages,
  options,
  BOTNAME,
} = require(".");

// axios
const runbot = async () => {
  const conn = await driver.connect({ host: HOST, useSsl: SSL });
  myuserid = await driver.login({ username: USER, password: PASS });
  const roomsJoined = await driver.joinRooms(ROOMS);
  console.log("joined rooms");

  // set up subscriptions - rooms we are interested in listening to
  const subscribed = await driver.subscribeToMessages();
  console.log("subscribed");

  // connect the processMessages callback
  const msgloop = await driver.reactToMessages(processMessages);
  console.log("connected and waiting for messages");
  console.log(msgloop);

  try {
    const response = await axios.request(options);
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }

  // when a message is created in one of the ROOMS, we
  // receive it in the processMesssages callback
  // greets from the first room in ROOMS
  const sent = await driver.sendToRoom(BOTNAME + " is listening ...", ROOMS[0]);
  console.log("Greeting message sent");
};
exports.runbot = runbot;
