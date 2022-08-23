import { HubConnectionBuilder } from '@microsoft/signalr';
import { markOnline, onReceiveMessage, updateFriendBtn, getFABpopup } from './Global';

export const ConnectionConstructor = (url) => {
    const connection = new HubConnectionBuilder().withUrl(url).build();

    //onclose, onreconnecting, onreconnected, ...
    connection.on("AskedOnline", function (sender) {
        markOnline(sender, true);
        connection.invoke("ShowOnline", sender);
    });

    connection.on("KnownOnline", function (sender) {
        markOnline(sender, true);
    });

    connection.on("KnownOffline", function (sender) {
        markOnline(sender, false);
    });

    connection.on("ReceiveNotification", function () {
        getFABpopup()[0].reload();
    });

    connection.on("ReceivePrivate", function (targetMail) {
        //re-setState instead of adding message
        onReceiveMessage(targetMail);
    });

    connection.on("UpdateFriendBtn", async function () {
        updateFriendBtn();
    });

    connection.start();
    return connection;
}