const express = require("express");
const path = require('path');
const app = express();
const http = require("http");
const fs = require('fs');


const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const server = http.createServer( app ); 
const proxy = require("socket.io")(server, { cors: { origin: 'tornadofe.metrological.com',credentials: true }, allowEIO3: true});
const port = 8543;

var proxyBroadCasters = new Map();
var proxyViewers = new Map();

proxy.on("connection", socket => {
  console.log("connection made!!! " + socket.id)
  socket.on("broadcaster", (data) => {
    console.log("registering broadcaster handlers");
    proxyBroadCasters.set(data.hwid, socket);

    socket.on("br_offer",  ( data ) => {
        proxyViewers.get(data.hwid).emit("br_offer", data);
        console.log("offer, needs to go to viewer")
    });
    socket.on("br_answer", ( data ) => {
        proxyViewers.get(data.hwid).emit("br_answer", data);
        console.log("answer, needs to go to viewer")
    });
    socket.on("br_candidate", ( data ) => {
        proxyViewers.get(data.hwid).emit("br_candidate", data);
        console.log("candidate, needs to go to viewer")
     })
  })
  socket.on("viewer", (data) => {
    if ( proxyBroadCasters.get(data.hwid) !== undefined) {
      console.log("registering viewer handlers");
      console.log("hwid: "+ data.hwid);
      if (console.log("slot: "+ data.slot)) {
        console.log("rack: "+ data.rackid);
      }
      proxyViewers.set(data.hwid, socket);
      console.log("replied viewer to node-app-broadcaster");

      socket.on("vw_offer",  ( data ) => {
        proxyBroadCasters.get(data.hwid).emit("vw_offer", data);
          console.log("offer, needs to go to broadcaster")
      });
      socket.on("vw_answer", ( data ) => {
        proxyBroadCasters.get(data.hwid).emit("vw_answer", data);
          console.log("answer, needs to go to broadcaster")
      });
      socket.on("vw_candidate", ( data ) => {
        proxyBroadCasters.get(data.hwid).emit("vw_candidate", data);
          console.log("candidate, needs to go to broadcaster")
      })
      socket.on("rcmd", ( data ) => {
        proxyBroadCasters.get(data.hwid).emit("rcmd", data);
          console.log("remotekey, needs to go to broadcaster")
      })
      socket.on("powercycle", ( data ) => {
        proxyBroadCasters.get(data.hwid).emit("powerCycle", data);
          console.log("powercycle, needs to go to broadcaster")
      })
      socket.on("picmd", ( data ) => {
        proxyBroadCasters.get(data.hwid).emit("vw_candidate", data);
          console.log("candidate, needs to go to broadcaster")
      })

      proxyBroadCasters.get(data.hwid).emit("viewer");
    }
    else
    {
      socket.emit("failure",{ 'message': "broadcaster nog registered"});
    }
  })
})

server.listen(port, () => console.log(`Proxy is running on port ${port}`));
