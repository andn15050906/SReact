var client;

export default async function IsLoggedIn() {
    return await fetch("/Identity/LoggedIn");
}

export async function LogOut() {
    return await fetch("/Identity/Logout", {
        method: "post"
    });
}

export async function IsConfirmed() {
    return await fetch("/Identity/Confirmed");
}

export async function GetClientChatInfo() {
    client = await fetch("/Identity/GetClientChatInfo");
    return client;
}

export async function GetClientAccountInfo() {
    return await fetch("/Identity/GetClientAccountInfo");
}