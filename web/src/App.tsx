
import React, { useEffect, useRef } from "react";
import io from "socket.io-client";



const pc_config = {
  iceServers: [
    {urls: ["turn:103.79.131.25:3478?transport=udp"
    ],
  username:"tony",
  credential:"123456"
 },
    {urls:["stun:103.79.131.25:3478"]}
  ],
};
const SOCKET_SERVER_URL = "http://103.79.131.25:8000";

const App = () => {
  const socketRef = useRef<SocketIOClient.Socket>();
  const pcRef = useRef<RTCPeerConnection>();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  

  const userRoomId= "111"
  const clientRoomId ="222"
  const sparator ="$"

  const setVideoTracks = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      if (!(pcRef.current && socketRef.current)) return;
      stream.getTracks().forEach((track) => {
        if (!pcRef.current) return;
        pcRef.current.addTrack(track, stream);
      });
      pcRef.current.onicecandidate = (e) => {
        if (e.candidate) {
          if (!socketRef.current) return;
          let data = {
            userRoomId: userRoomId,
            clientRoomId: clientRoomId,
            data:`${e.candidate.sdpMid}${sparator}${e.candidate.sdpMLineIndex}${sparator}${e.candidate.candidate}`
          }

           console.log("send Ice "+JSON.stringify(e.candidate));
          socketRef.current.emit("ICE",data);
        }
      };

      pcRef.current.onicecandidateerror = (e) => {
           console.log("error Ice "+JSON.stringify(e));
      };
      
      pcRef.current.oniceconnectionstatechange = (e) => {
        console.log(e);
        console.log("masuk send Ice"+JSON.stringify(e));
      };

      pcRef.current.ontrack = ({transceiver, streams: [stream]}) => {
         
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = new MediaStream([transceiver.receiver.track]);
            } 
      };
      socketRef.current.emit("STATE", {
        userRoomId: userRoomId,
        clientRoomId: clientRoomId
      });
    } catch (e) {
      console.error(e);
    }
  };


  const createOffer = async () => {
    console.log("create offer");
    if (!(pcRef.current && socketRef.current)) return;
    try {
      const sdp = await pcRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pcRef.current.setLocalDescription(new RTCSessionDescription(sdp));
      let data = {
        userRoomId: userRoomId,
        clientRoomId: clientRoomId,
        data: sdp.sdp
      }
      socketRef.current.emit("OFFER",data);
    } catch (e) {
      console.error(e);
    }
  };

  const createAnswer = async (sdp: RTCSessionDescription) => {
    if (!(pcRef.current && socketRef.current)) return;
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      console.log("answer set remote description success");
      const mySdp = await pcRef.current.createAnswer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true,
      });
      console.log("create answer");
      await pcRef.current.setLocalDescription(new RTCSessionDescription(mySdp));
      let data = {
        userRoomId: userRoomId,
        clientRoomId: clientRoomId,
        data: mySdp.sdp
      }
      socketRef.current.emit("ANSWER",data);


      let dataUser = {
        userRoomId: userRoomId,
        clientRoomId: clientRoomId,
        nameAgent: "Lisa Agent",
        urlVideoJingle: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_30mb.mp4",
        InfoHold:"Mohon tunggu sebentar, dalam proses menghubungkan.",
        InfoHoldAgent:"Mohon tunggu sebentar, saat ini agent sedang Hold pembicaraan ini."
      }
      socketRef.current.emit("DATA",dataUser);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    socketRef.current = io.connect(SOCKET_SERVER_URL);
    pcRef.current = new RTCPeerConnection(pc_config);

    socketRef.current.on(userRoomId, (state: String) => {
      var value = state.split(" ");
      var stateValue = value[0]
      
      if(state.startsWith("ACTION")){

      }

      if(state.startsWith("STATE")){


        if(stateValue =="NotReady"){

        }

        if(stateValue =="Ready"){
          createOffer();
        }

      }
      
      if(stateValue =="OFFER"){

       const value = state.split("___")

        const data ={
          sdp:  value[1],
          type : "offer" as RTCSdpType
        } 
        console.log("Create Offer "+value[1]);
        console.log(data);
        createAnswer(new RTCSessionDescription(data));
      }

      if(stateValue =="ANSWER"){
        const value = state.split("___")
        if (!pcRef.current) return;
        const data ={
          sdp:  value[1],
          type : "answer" as RTCSdpType
        } 
        console.log("Create answer "+value[1]);
        console.log(data);
        pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
      }

      if(stateValue =="ICE"){
        const value = state.split("___")
        const results =  value[1].split("$")
        const result={
          sdpMid: results[0],
          sdpMLineIndex : Number(results[1]),
          candidate: results[2]
        }
        
        console.log("reciver Ice "+`${result.sdpMid}${sparator}${result.sdpMLineIndex}${sparator}${result.candidate}`);

       let rTCIceCandidateInit = async (candidate: RTCIceCandidateInit) => {
        if (!pcRef.current) return;
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("candidate add success");
        }

        rTCIceCandidateInit(result)
      }
    
    });

    setVideoTracks();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  


  let runAction = (action: string) => (event: any) => {
    let user = {
      userRoomId: userRoomId,
      clientRoomId: clientRoomId,
      data: action
    }
      socketRef.current?.emit("ACTION",user)
  }

  return (
    <div>
      <video
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: "black",
        }}
        muted
        ref={localVideoRef}
        autoPlay
      />
      <video
        id="remotevideo"
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: "black",
        }}
        ref={remoteVideoRef}
        autoPlay
      />

    <button onClick={
      runAction("ShowSignature")
    }>Show Signature</button>

<button onClick={
      runAction("ShowFrameFaceCard")
    }>Show Selfi Card</button>

<button onClick={
      runAction("ShowFrameCard")
    }>Show Card</button>

<button onClick={
      runAction("AgentHold")
    }>Hold Agent</button>

<button onClick={
      runAction("Empty")
    }>Close All Action</button>
    </div>
    

    
  );
};

export default App;
