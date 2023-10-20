let express = require("express");
let http = require("http");
let app = express();
let cors = require("cors");
let server = http.createServer(app);
const io = require('socket.io')(server);

app.use(cors());
const PORT = process.env.PORT || 8000;

let users = {};

io.on("connection", (socket) => {
  socket.on("STATE", (data) => {
    let client = users[data.clientRoomId]

    console.log(`User ${data.userRoomId} Connected`)
    socket.emit(data.userRoomId,"STATE Connected")

    users[data.userRoomId]= {
       socketId: socket.id,
       userRoomId: data.userRoomId
     };
    console.log(`Id Socket user ${data.userRoomId} is ${users[data.userRoomId].socketId}`)


    if(client){
      console.log(`Cliend Ready ${data.clientRoomId} socket id ${users[data.clientRoomId].socketId}`)
      socket.emit(data.userRoomId,"STATE Ready");
    }else{
      console.log(`Cliend Not Ready ${data.clientRoomId}`)
      socket.emit(data.userRoomId,"STATE NotReady");
    }
    console.log(`Total user ${users.count}`)
  });

  socket.on("DATA", (data) => {
    console.log("Send data to Client " + data.clientRoomId);

    console.log("data " + JSON.stringify(data));
    socket.to(users[data.clientRoomId].socketId).emit(data.clientRoomId,"DATA "+JSON.stringify(data))

  });

  socket.on("ACTION", (data) => {
    console.log(`Send Action to Client  ${data.clientRoomId} && socket Id ${users[data.clientRoomId].socketId}`)
    socket.to(users[data.clientRoomId].socketId).emit(data.clientRoomId,"ACTION "+data.data)
  });
  

  socket.on("OFFER", (data) => {
    console.log(`Send OFFER to Client  ${data.clientRoomId} && socket Id ${users[data.clientRoomId].socketId}`)
    socket.to(users[data.clientRoomId].socketId).emit(data.clientRoomId,"OFFER "+ data.data)

    console.log(`Send status Creating to Client ${data.clientRoomId}`)
    socket.to(users[data.clientRoomId].socketId).emit(data.clientRoomId,"STATE Creating")
   

  });

  socket.on("ANSWER", (data) => {
    console.log(`Send ANSWER to Client  ${data.clientRoomId} && socket Id ${users[data.clientRoomId].socketId}`)
    socket.to(users[data.clientRoomId].socketId).emit(data.clientRoomId,"ANSWER "+ data.data);
    console.log("Send status Active to Client " + data.clientRoomId);
    socket.to(users[data.clientRoomId].socketId).emit(data.clientRoomId,"STATE Active")

  });

  socket.on("ICE", (data) => {
    console.log(`Send ICE to Client  ${data.clientRoomId} && socket Id ${users[data.clientRoomId].socketId}`)
    socket.to(users[data.clientRoomId].socketId).emit(data.clientRoomId,"ICE "+ data.data);
   
  });

  socket.on("disconnect", () => {
    

   let user = Object.values(users).filter(user => user.socketId === socket.id)
    if(user){
      delete users[user.userRoomId];
    }
    console.log(`[${user.userRoomId}]: ${socket.id} exit`);
    console.log(users);
  });
});

server.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
