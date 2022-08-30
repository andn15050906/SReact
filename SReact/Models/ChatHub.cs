using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Identity;

namespace SReact.Models
{
    public class ChatHub : Hub
    {
        //all (await user).Id to Caller?
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
            ConnectionHandler.ConnectedIds.Add(Context.ConnectionId);
            //Ask all if online
            //OnAsked, invoke online to all
            await AskOnline();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            ConnectionHandler.ConnectedIds.Remove(Context.ConnectionId);
            //
            await ShowOffline(await userManager.GetEmailAsync(await userManager.GetUserAsync(Context.User)));
            await base.OnDisconnectedAsync(exception);
        }


        //User will not be passed as argument to prevent falsification
        public async Task SendPrivate(string receiverEmail, string content, string option)
        {
            //option = text / file
            user = userManager.GetUserAsync(Context.User);
            receiver = userManager.FindByEmailAsync(receiverEmail);
            if ((await user).Email == (await receiver).Email)
                return;
            userMail = await userManager.GetEmailAsync(await user);
            //save to db
            if (option == "text")
                context.SendPrivate(await user, await receiver, content);
            else if (option == "file")
                context.UploadPrivate(await user, await receiver, content);
            //invoke re-setState
            await Clients.User((await user).Id).SendAsync("ReceiveMsg", receiverEmail);
            await Clients.User((await receiver).Id).SendAsync("ReceiveMsg", userMail);
        }

        //Group Chat here is unlike chat room - no in/out records needed
        public async Task SendGroup(int groupId, string content, string option)
        {
            //pass a list of users (json) or groupId only?
            //skipped checking if user is in group
            user = userManager.GetUserAsync(Context.User);
            List<string> receivers = new List<string>();
            var memLst = context.GetMembers(groupId);
            foreach (AppUser user in memLst)
                receivers.Add(user.Id);
            if (option == "text")
                context.SendGroup(await user, groupId, content);
            else if (option == "file")
                context.UploadGroup(await user, groupId, content);
            await Clients.Users(receivers).SendAsync("ReceiveMsg", groupId);
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






        //ChatRoom - no database needed
        public async Task CreateRoom()
        {
            user = userManager.GetUserAsync(Context.User);
            userMail = await userManager.GetEmailAsync(await user);

            //generate random room code
            StringBuilder roomId = new StringBuilder(5);
            Random rd = new Random();
            do
            {
                roomId = new StringBuilder(5);
                for (int i = 0; i < 5; i++)
                    roomId.Append((char)rd.Next('a', 'a' + 26));
            }
            while (ConnectionHandler.Rooms.Any(ele => ele.Id == roomId.ToString()));

            Room room = new Room(roomId.ToString(), userMail, Context.ConnectionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString());
            await Clients.Caller.SendAsync("CreatedRoom", room.Id);
        }
        public async Task JoinRoom(string roomId)
        {
            user = userManager.GetUserAsync(Context.User);
            userMail = await userManager.GetEmailAsync(await user);

            Room room = ConnectionHandler.Rooms.Find(ele => ele.Id == roomId);
            if (room == null)
            {
                await Clients.Caller.SendAsync("RoomNotFound");
                return;
            }
            room.AddGuest(userMail, Context.ConnectionId);
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            //sending to multiple connections cause bug
            await Clients.Client(room.HostConnectionId).SendAsync("StartCall", roomId);
            await Clients.Group(roomId).SendAsync("NewJoin", userMail, roomId);
        }
        //OfferSDP stable?
        /*public void SetOfferSDP(string SDP, string roomId) {
            //if user is Creator
            ConnectionHandler.Rooms.Find(ele => ele.Id == roomId).OfferSDP = SDP;
        }*/
        public async Task SendOffer(string roomId, string offerSDP)
        {
            await Clients.OthersInGroup(roomId).SendAsync("ReceiveOffer", roomId, offerSDP);
        }
        public async Task SetAnswerSDP(string roomId, string SDP)
        {
            await Clients.OthersInGroup(roomId).SendAsync("ReceiveAnswer", SDP);
        }
        public async Task SendICECandidate(string roomId, string candidate)
        {
            await Clients.OthersInGroup(roomId).SendAsync("ReceiveICECandidate", candidate);
        }
        

        //not yet used (chat feature)
        public async Task SendRoom(string room, string content)
        {
            //allow file?
            //check if user is in room
            userMail = await userManager.GetEmailAsync(await userManager.GetUserAsync(Context.User));
            await Clients.Group(room).SendAsync("ReceiveRoomMsg", userMail, content);
        }
    }

    //use this for statistic (add feature)
    public static class ConnectionHandler
    {
        public static List<string> ConnectedIds = new List<string>();
        public static List<Room> Rooms = new List<Room>();
        public static List<(string, Room)> Connection_Room = new List<(string, Room)>();
    }

    public class Room
    {
        public string Id;
        public string Host;
        public string HostConnectionId;
        public List<string> Guests;
        public string OfferSDP;

        public Room(string roomId, string hostMail, string hostConnectionId)
        {
            Id = roomId;
            Host = hostMail;
            HostConnectionId = hostConnectionId;
            Guests = new List<string>();
            ConnectionHandler.Rooms.Add(this);
            ConnectionHandler.Connection_Room.Add((hostConnectionId, this));
        }

        public void AddGuest(string mail, string connectionId)
        {
            Guests.Add(mail);
            ConnectionHandler.Connection_Room.Add((connectionId, this));
        }

        public void RemoveGuest(string mail, string connectionId)
        {
            Guests.Remove(mail);
            ConnectionHandler.Connection_Room.Remove((connectionId, this));
        }
    }
}
