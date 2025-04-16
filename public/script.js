
const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;
let myVideoStream;
let userName = prompt("Enter your name") || "Anonymous";

// PeerJS
const peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      setTimeout(() => {
        connectToNewUser(userId, stream);
      }, 1000);
    });

    socket.on("user-disconnected", (userId) => {
      document.querySelectorAll("video").forEach((video) => {
        if (video.dataset.userId === userId) video.remove();
      });
    });

    document.getElementById("chat_message").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim()) {
        socket.emit("message", `${userName}: ${e.target.value}`);
        e.target.value = "";
      }
    });

    socket.on("createMessage", (message) => {
      const li = document.createElement("li");
      li.innerText = message;
      document.getElementById("messages").appendChild(li);
      document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
    });
  });

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  video.dataset.userId = userId;
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => video.remove());
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

const muteUnmute = () => {
  const audioTrack = myVideoStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
};

const playStop = () => {
  const videoTrack = myVideoStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
};

const leaveMeeting = () => {
  socket.emit("leave-room", ROOM_ID, peer.id);
  window.location.href = "/";
};
