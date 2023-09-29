let express = require("express");
let http = require("http");
let app = express();
let cors = require("cors");
let server = http.createServer(app);
let socketio = require("socket.io");
let io = socketio.listen(server);

app.use(cors());
const PORT = process.env.PORT || 8000;

let users = {};

io.on("connection", (socket) => {
  socket.on("STATE", (data) => {
    let client = users[data.clientId]

    console.log(`User ${data.userId} Connected`)
    socket.emit(data.userId,"STATE Connected")

    users[data.userId]= {
       socketId: socket.id,
       userId: data.userId
     };
    console.log(`Id Socket user ${data.userId} is ${users[data.userId].socketId}`)


    if(client){
      console.log(`Cliend Ready ${data.clientId} socket id ${users[data.clientId].socketId}`)
      socket.emit(data.userId,"STATE Ready");
    }else{
      console.log(`Cliend Not Ready ${data.clientId}`)
      socket.emit(data.userId,"STATE NotReady");
    }
    console.log(`Total user ${users.count}`)
  });


  socket.on("ACTION", (data) => {
    console.log(`Send Action to Client  ${data.clientId} && socket Id ${users[data.clientId].socketId}`)
    socket.to(users[data.clientId].socketId).emit(data.clientId,"ACTION "+data.data)
  });
  

  socket.on("OFFER", (data) => {
    console.log(`Send OFFER to Client  ${data.clientId} && socket Id ${users[data.clientId].socketId}`)
    socket.to(users[data.clientId].socketId).emit(data.clientId,"OFFER "+ data.data)

    console.log(`Send status Creating to Client ${data.clientId}`)
    socket.to(users[data.clientId].socketId).emit(data.clientId,"STATE Creating")
   

  });

  socket.on("ANSWER", (data) => {
    console.log(`Send ANSWER to Client  ${data.clientId} && socket Id ${users[data.clientId].socketId}`)
    socket.to(users[data.clientId].socketId).emit(data.clientId,"ANSWER "+ data.data);
    socket.to(users[data.clientId].socketId).emit(data.clientId,"DATA "+ {
      nameAgent:"Lisa Agent",
      urlVideoJingle:"",
      InfoHold:"",
      InfoHoldAgent:""
    });
    console.log("Send status Active to Client " + data.clientId);
    socket.to(users[data.clientId].socketId).emit(data.clientId,"STATE Active")

  });

  socket.on("ICE", (data) => {
    console.log(`Send ICE to Client  ${data.clientId} && socket Id ${users[data.clientId].socketId}`)
    socket.to(users[data.clientId].socketId).emit(data.clientId,"ICE "+ data.data);
   
  });

  socket.on("disconnect", () => {
    

   let user = Object.values(users).filter(user => user.socketId === socket.id)
    if(user){
      delete users[user.userId];
    }
    console.log(`[${user.userId}]: ${socket.id} exit`);
    console.log(users);
  });
});

server.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});
