using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace SReact.Models
{
    public abstract class SocialInfo
    {
        public string Id;
    }

    public class UserInfo : SocialInfo
    {
        public string ContactName;
        public string Surname;
        public string FirstName;
        public string Email;
        public string Role;
        public bool IsFriend;
        public string Avatar;
        public string CoverImg;

        public static async Task<List<UserInfo>> GetManageInfos(UserManager<AppUser> manager, IEnumerable<AppUser> users)
        {
            List<UserInfo> infos = new List<UserInfo>();
            foreach (AppUser user in users)
                infos.Add(new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email,
                    Role = (await manager.GetRolesAsync(user)).FirstOrDefault()
                });
            return infos;
        }
        
        public static List<UserInfo> GetChatInfos(Context context, IEnumerable<AppUser> users, AppUser client)
        {
            List<UserInfo> infos = new List<UserInfo>();
            foreach (AppUser user in users)
                infos.Add(new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email,
                    ContactName = GetContactName(user),
                    Surname = user.Surname,
                    FirstName = user.FirstName,
                    IsFriend = context.AreFriends(user.Id, client.Id),
                    Avatar = user.Avatar,
                    CoverImg = user.CoverImg
                });
            return infos;
        }

        public static string GetContactName(AppUser user) => user.Surname + " " + user.FirstName;
    }

    public class GroupInfo : SocialInfo
    {
        public int ChatGroupId;
        public string GroupName;
        public UserInfo AdminInfo;
        public List<UserInfo> MemberInfos;
        public string Avatar;
        public DateTime FoundingDate;

        //Navigation Load problem?
        public static GroupInfo GetGroupInfo(Context context, ChatGroup chatGroup, AppUser client)
        {
            List<AppUser> memLst = new List<AppUser>();
            foreach (Member_ChatGroup mcg in chatGroup.Member_ChatGroups)
                memLst.Add(mcg.Member);
            return new GroupInfo
            {
                ChatGroupId = chatGroup.ChatGroupId,
                GroupName = chatGroup.GroupName,
                AdminInfo = UserInfo.GetChatInfos(context, new List<AppUser> { chatGroup.GroupAdmin }, client)[0],
                MemberInfos = UserInfo.GetChatInfos(context, memLst, client),
                Avatar = chatGroup.Avatar,
                FoundingDate = chatGroup.FoundingDate
            };
        }
    }
}
