import $ from 'jquery';
//provide global methods / methods involve global variables

var connection;
var userMail, userProfile;
var contactDiv;                                                 //contactLst contains the index of contactDiv
var contactLst = [];                                            //back-end for contactDiv
var home = [], friendBtn = [], FABpopup = [], postArea = [];    //invoke react func
var openingBoxs = [], callWindow = [];                          //invoke react func
var rcvNotify = [], sentNotify = [];
var targetMsgId, targetMail;
var theme = 0;

//Notification unread & Read - signalr notify update
//contactDiv dom search is bad

export async function init(document, profile, signalRConnection) {
    userProfile = profile;
    userMail = profile.email;
    connection = signalRConnection;
    contactDiv = document.getElementById("contactLst");
    //await = ; await = -> 244 -> 494
    //= =; await await  -> 204 -> 400
    //Promise.all       -> 207 -> 377
    await Promise.all([fetchRcvNotification(), fetchSentNotification()]);
}

export function fetchRcvNotification() {
    return $.get('Chat/GetNotifications', function (response) {
        rcvNotify = [];
        response.forEach(function (val) { rcvNotify.push(val); });
    });
}

//Rcv is exported but not Sent
function fetchSentNotification() {
    return $.get("Chat/GetSentNotifications", function (response) {
        sentNotify = [];
        response.forEach(function (val) { sentNotify.push(val); });
    });
}

export function addToContactLst(info) {
    var index = contactLst.length;
    info.divIndex = index;
    contactLst[index] = info;
}






export function showProfile(profile) {
    home[0].setProfile(profile);
}

export function showGroup(group) {
    home[0].setGroup(group);
}

export function closeChat(profile) {
    home[0].closeChat(profile);
}

export async function showNotifications() {
    FABpopup[0].show();
}

export function markOnline(mail, status) {
    if (mail === userMail)
        return;
    var index = contactLst.findIndex(ele => ele.email === mail);
    //infinite?
    if (status === true) {
        if (index === -1) {
            setTimeout(function () { markOnline(mail, status) }, 1000);
            return;
        }
    }
    if (!contactDiv)
        contactDiv = document.getElementById("contactLst");
    var element = contactDiv.children[contactLst[index].divIndex];
    if (status !== element.children[1].classList.contains("online")) {
        element.children[1].classList.toggle("online");
    }
}

export function setTargetMsg(id, mail) {
    targetMsgId = id;
    targetMail = mail;
}

export function sendPrivate(rcvMail, content, option) {
    connection.invoke("SendPrivate", rcvMail, content, option).catch(function (err) {
        return console.error(err.toString());
    });
}

export function sendFilePrivate(rcvMail, file) {
    //upload exception??
    var formData = new FormData();
    formData.append("file", file);
    $.ajax({
        type: "POST",
        data: formData,
        url: 'Chat/UploadFile',
        processData: false,
        contentType: false,
        success: function (response) { sendPrivate(rcvMail, response, "file"); }    //response = file link
    });
}

export function sendGroup(groupId, content, option) {
    connection.invoke("SendGroup", groupId, content, option).catch(function (err) {
        return console.error(err.toString());
    });
}

export function sendFileGroup(groupId, file) {
    var formData = new FormData();
    formData.append("file", file);
    $.ajax({
        type: "POST",
        data: formData,
        url: 'Chat/UploadFile',
        processData: false,
        contentType: false,
        success: function (response) { sendGroup(groupId, response, "file"); }
    });
}

export function onReceiveMsg(identifier) {
    //notify if box is not yet opened (not seen)
    updateBox(identifier);
}

export function deleteMsg() {
    if (!targetMsgId || !targetMail)
        return;
    $.post('Chat/DeleteMessage?recordId=' + targetMsgId, function () {
        updateBox(targetMail);
        setTargetMsg(null, null);
    });
}

export async function fetchFriends(mail) {
    return await fetch("/Chat/GetFriends?email=" + mail);
}

export function removeFriend() {
    if (!targetMail)
        return;
    $.post('Chat/RemoveFriend?mail=' + targetMail);
    setTargetMsg(null, null);
    friendBtn[0].setFriend(false);
    friendBtn[0].stopLoading();
}

export async function fetchPosts(mail) {
    return await fetch("/Chat/GetPosts?email=" + mail);
}






export function createRoom() {
    connection.invoke("CreateRoom");
}

export function joinRoom(roomId) {
    connection.invoke("JoinRoom", roomId);
}

export function sendRoom(roomId, content) {
    connection.invoke("SendRoom", roomId, content);
}






export function getConnection() { return connection; }
export function getUserMail() { return userMail; }
export function getUserProfile() { return userProfile; }
export function getRcvNotify() { return rcvNotify; }
export function getSentNotify() { return sentNotify; }
export function getHome() { return home; }
export function getFriendBtn() { return friendBtn; }
export function getFABpopup() { return FABpopup; }
export function getPostArea() { return postArea; }
export function getOpeningBoxs() { return openingBoxs; }
export function getCallWindow() { return callWindow; }
export function getTheme() { return theme; }

export function toClientTime(serverTime) {
    var timeStrs = serverTime.split(".")[0].split("T");
    return timeStrs[0].slice(timeStrs[0].indexOf('-') + 1) + " " + timeStrs[1];
}

export function getContactName(profile) {
    return profile.surname + " " + profile.firstName;
}






function updateBox(identifier) {
    if (isNaN(identifier))
        openingBoxs.find(ele => ele.props.info.email === identifier).componentDidMount();
    else
        openingBoxs.find(ele => ele.props.info.chatGroupId === identifier).componentDidMount();
}

export function setRmvMsgModal(bool) {
    home[0].removeMsgModal(bool);
}

export async function updateFriendBtn() {
    await fetchRcvNotification();
    await fetchSentNotification();
    friendBtn[0].stopLoading();
}

export function updateProfilePage() {
    postArea[0].reload();
}

export function inCall() {
    getCallWindow()[0].setCall(true);
    document.getElementById("nav").style.display = "none";
}

export function outCall() {

}

export function changeTheme() {
    theme = theme === 0 ? 1 : 0;
    document.documentElement.classList.toggle("dark-theme");
}