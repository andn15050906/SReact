using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Identity;

namespace SReact.Models
{
    public class ChatHub : Hub
    {
        private readonly Context context;
        private readonly UserManager<AppUser> userManager;
        private Task<AppUser> user, receiver;
        private string userMail;

        public ChatHub(Context context, UserManager<AppUser> userManager)
        {
            this.context = context;
            this.userManager = userManager;
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            //Ask all if online
            //OnAsked, invoke online to all
            await AskOnline();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await ShowOffline(await userManager.GetEmailAsync(await userManager.GetUserAsync(Context.User)));
            await base.OnDisconnectedAsync(exception);
        }



        public async Task SendPrivate(string receiverEmail, string content, string option)
        {
            //option = text / file
            user = userManager.GetUserAsync(Context.User);
            receiver = userManager.FindByEmailAsync(receiverEmail);
            if (user == receiver)
                return;
            userMail = await userManager.GetEmailAsync(await user);
            //save to db
            if (option == "text")
                context.SendPrivate(await user, await receiver, content);
            else if (option == "file")
                context.UploadPrivate(await user, await receiver, content);
            //invoke re-setState
            await Clients.User((await user).Id).SendAsync("ReceivePrivate", receiverEmail);
            await Clients.User((await receiver).Id).SendAsync("ReceivePrivate", userMail);
        }





        public async Task AskOnline()
        {
            user = userManager.GetUserAsync(Context.User);
            userMail = await userManager.GetEmailAsync(await user);
            //show to all friends (-> Users) that {user} is asking if they are online
            await Clients.All.SendAsync("AskedOnline", userMail);
        }

        public async Task ShowOnline(string receiverEmail)
        {
            user = userManager.GetUserAsync(Context.User);
            userMail = await userManager.GetEmailAsync(await user);
            receiver = userManager.FindByEmailAsync(receiverEmail);
            await Clients.User((await receiver).Id).SendAsync("KnownOnline", userMail);
        }

        public async Task ShowOffline(string senderEmail)
        {
            await Clients.All.SendAsync("KnownOffline", senderEmail);
        }



        public async Task SendFriendRequest(string receiverEmail)
        {
            user = userManager.GetUserAsync(Context.User);
            receiver = userManager.FindByEmailAsync(receiverEmail);
            if (await user == await receiver)
                return;
            userMail = await userManager.GetEmailAsync(await user);
            //save to db
            string message = UserInfo.GetContactName(await user) + " sent you a friend request";
            if (context.SendNotification(await user, await receiver, message, "friend", userMail))
            {
                await Clients.User((await receiver).Id).SendAsync("ReceiveNotification");
                await Clients.Caller.SendAsync("UpdateFriendBtn");
            }
        }

        //you can't see if the other confirm request immediately
        //-> no hub for confirming notifications
    }
}
