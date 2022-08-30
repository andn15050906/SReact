import { HubConnectionBuilder } from '@microsoft/signalr';
import * as Glob from './Global';

export const ConnectionConstructor = (url) => {
    const connection = new HubConnectionBuilder().withUrl(url).build();

    //onclose, onreconnecting, onreconnected, ...
    connection.on("AskedOnline", function (sender) {
        connection.invoke("ShowOnline", sender);
        Glob.markOnline(sender, true);
    });

    connection.on("KnownOnline", function (sender) {
        Glob.markOnline(sender, true);
    });

    connection.on("KnownOffline", function (sender) {
        Glob.markOnline(sender, false);
    });

    connection.on("ReceiveNotification", function () {
        Glob.getFABpopup()[0].reload();
    });

    connection.on("ReceiveMsg", function (identifier) {
        //send only the target identifier that needs re-setState instead of adding message
        //identifier is mail / groupId
        Glob.onReceiveMsg(identifier);
    });

    connection.on("UpdateFriendBtn", async function () {
        Glob.updateFriendBtn();
    });



    //firefox suggest use 2
    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    }
    const constraints = {
        audio: { //echoCancellation: { exact: hasEchoCancellation }
        },
        video: { width: 400, height: 300 }
    };
    //do not allow multiple calls at once
    var localStream, rtcPeerConnection;




    

    async function setUpLocal() {
        try {
            Glob.inCall();
            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            document.querySelector('video#local').srcObject = localStream;
        } catch (e) {
            console.error(e);
        }
    }

    function setUpPeerConnection(roomId) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        localStream.getTracks().forEach((track) => { rtcPeerConnection.addTrack(track, localStream); });
        rtcPeerConnection.ontrack = function (e) {
            //host called this if have setRemoteDescription
            document.querySelector('video#remote').srcObject = e.streams[0];
        }
        rtcPeerConnection.onicecandidate = function (e) {
            if (e.candidate)
                connection.invoke("SendICECandidate", roomId, JSON.stringify(e.candidate))
        }
    }

    connection.on("CreatedRoom", async (roomId) => {
        console.log(roomId);
        await setUpLocal();
    })
    
    connection.on("StartCall", async (roomId) => {
        //host
        setUpPeerConnection(roomId);
        var offerSDP = await rtcPeerConnection.createOffer();
        rtcPeerConnection.setLocalDescription(offerSDP);
        connection.invoke("SendOffer", roomId, JSON.stringify(offerSDP));
    })
    
    connection.on("ReceiveOffer", async (roomId, sdp) => {
        //guest
        await setUpLocal();
        setUpPeerConnection(roomId);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(sdp)));
        var answerSDP = await rtcPeerConnection.createAnswer();
        rtcPeerConnection.setLocalDescription(answerSDP);
        connection.invoke("SetAnswerSDP", roomId, JSON.stringify(answerSDP));
    })

    connection.on("ReceiveAnswer", function (SDP) {
        try {
            rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(SDP)));
        } catch (err) {
            console.log(err);
        }
    })

    connection.on("ReceiveICECandidate", function (candidate) {
        try {
            //guest show bug: rtcPeerConnection undefined
            rtcPeerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate)));
        } catch (err) {
            console.log(err);
        }
    })

    connection.on("NewJoin", function (mail, roomId) {
        console.log(mail + " has joined the room " + roomId);
    });

    connection.on("RoomNotFound", function () {
        alert('Room does not exist');
    })

    //not yet used (chat feature)
    connection.on("ReceiveRoomMsg", function (mail, content) {
        console.log(mail + ": " + content);
    });

    connection.start();
    return connection;
}