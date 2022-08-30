using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using SReact.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace SReact.Controllers
{
    //[Route("api/[controller]")]
    [Authorize]
    public class ChatController : Controller
    {
        //Big data??
        private readonly UserManager<AppUser> userManager;
        private readonly Context context;

        public ChatController(UserManager<AppUser> userManager, Context context)
        {
            this.userManager = userManager;
            this.context = context;
        }



        //Users
        public async Task<UserInfo> GetInfo(string email)
        {
            var user = await userManager.GetUserAsync(User);
            var target = new List<AppUser>();
            target.Add(userManager.Users.FirstOrDefault(ele => ele.Email == email));
            return UserInfo.GetChatInfos(context, target, user)[0];
        }
        public async Task<IEnumerable<UserInfo>> GetOtherChatUsers()
        {
            var user = await userManager.GetUserAsync(User);
            var lst = userManager.Users.Where(ele => ele.Email != user.Email);
            return UserInfo.GetChatInfos(context, lst, user);
        }
        public async Task<IEnumerable<UserInfo>> GetFriends(string email)
        {
            var user = userManager.GetUserAsync(User);
            var lst = context.GetFriends(await userManager.FindByEmailAsync(email));
            return UserInfo.GetChatInfos(context, lst, await user);
        }
        public async Task RemoveFriend(string mail)
        {
            var user = await userManager.GetUserAsync(User);
            //also handle notifications
            context.RemoveFriend(user, mail);
        }



        //ChatRecords
        //Single
        public async Task<IEnumerable<ChatRecord>> GetChatRecords(string mail1, string mail2)
        {
            var user = userManager.GetUserAsync(User);
            var user1 = await userManager.FindByEmailAsync(mail1);
            var user2 = await userManager.FindByEmailAsync(mail2);
            if ((await user).Id != user1.Id && (await user).Id != user2.Id)     //either mail1 or mail2 must be user
                return new List<ChatRecord>();
            //Real chat apps don't load all at once
            //Cache ?
            return context.GetChatRecords(user1.Id, user2.Id);
        }
        public IEnumerable<ChatRecord> GetGroupChatRecords(int groupId) => context.GetChatRecords(groupId);
        [HttpPost] public void DeleteMessage(int recordId) => context.DeleteChatRecord(recordId);
        [HttpPost] public string UploadFile(IFormFile file) => context.CreateChatFile(file);



        //Notifications
        public async Task<IEnumerable<Notification>> GetNotifications() => context.GetNotifications(await userManager.GetUserAsync(User), true);
        public async Task<IEnumerable<Notification>> GetSentNotifications() => context.GetNotifications(await userManager.GetUserAsync(User), false);
        public async Task UpdateNotification(int id, bool confirm)
        {
            var user = await userManager.GetUserAsync(User);
            var notify = context.Notifications.Include(ele => ele.Sender).Include(ele => ele.Receiver)
                .FirstOrDefault(ele => (ele.Receiver.Id == user.Id || ele.Sender.Id == user.Id) && ele.NotificationId == id);
            if (notify == null)
                return;

            if (confirm)
                context.UpdateNotification(id, "confirmed");
        }
        public async Task DeleteNotification(int id)
        {
            var user = await userManager.GetUserAsync(User);
            var notify = context.Notifications.Include(ele => ele.Sender).Include(ele => ele.Receiver)
                .FirstOrDefault(ele => (ele.Receiver.Id == user.Id || ele.Sender.Id == user.Id) && ele.NotificationId == id);

            context.DeleteNotification(notify);
        }



        //Posts
        public async Task<int> CreatePost(string restriction, string content, IFormFile file, string tags)
        {
            List<string> decodedTags = JsonConvert.DeserializeObject<List<string>>(tags);
            Post post = new Post
            {
                Restriction = restriction,
                Content = content,
                File = context.CreatePostFile(file),
                Time = DateTime.Now
            };
            return context.CreatePost(post, await userManager.GetUserAsync(User), decodedTags);
        }
        public async Task<IEnumerable<PostInfo>> GetPosts(string email) => context.GetPosts((await userManager.FindByEmailAsync(email)).Id);



        //Comments
        public async Task<int> CreatePostComment(int postId, string content, IFormFile file)
        {
            Comment comment = new Comment
            {
                Content = content,
                File = context.CreatePostFile(file),
                Time = DateTime.Now
            };
            return context.CreatePostComment(comment, await userManager.GetUserAsync(User), postId);
        }
        public IEnumerable<Comment> GetComments(string ids)
        {
            //Server doesn't know which comment was fetched
            //Client actively request which comment to fetch
            List<int> decodedIds = JsonConvert.DeserializeObject<List<int>>(ids);
            return context.GetComments(decodedIds);
        }



        //Groups
        public async Task<int> CreateGroup(string name, string memberMails)
        {
            List<string> decodedMails = JsonConvert.DeserializeObject<List<string>>(memberMails);
            //Admin is also member
            List<AppUser> members = new List<AppUser>();
            foreach (string mail in decodedMails)
                members.Add(await userManager.FindByEmailAsync(mail));
            return context.CreateGroup(name, await userManager.GetUserAsync(User), members);
        }
        public async Task<IEnumerable<GroupInfo>> GetChatGroups()
        {
            //user only
            AppUser user = await userManager.GetUserAsync(User);
            IEnumerable<ChatGroup> groups = context.GetChatGroups(user);
            List<GroupInfo> infos = new List<GroupInfo>();
            foreach (ChatGroup group in groups)
                infos.Add(GroupInfo.GetGroupInfo(context, group, user));
            return infos;
        }
    }
}
