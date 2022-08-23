using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;
using System.Linq;

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

        public static List<UserInfo> GetChatInfos(UserManager<AppUser> manager, Context context, IEnumerable<AppUser> users, AppUser self)
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
                    IsFriend = context.AreFriends(user.Id, self.Id),
                    Avatar = user.Avatar,
                    CoverImg = user.CoverImg
                });
            return infos;
        }

        public static string GetContactName(AppUser user) => user.Surname + " " + user.FirstName;
    }

    public class GroupInfo : SocialInfo
    {
        public string GroupName;
    }
}
