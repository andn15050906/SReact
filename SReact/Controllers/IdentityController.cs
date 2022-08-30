using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using SReact.Models;
using Newtonsoft.Json;

namespace SReact.Controllers
{
    public class IdentityController : Controller
    {
        private readonly UserManager<AppUser> userManager;
        private readonly SignInManager<AppUser> signInManager;
        private readonly Context context;

        public IdentityController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, Context context)
        {
            this.userManager = userManager;
            this.signInManager = signInManager;
            this.context = context;
        }

        [HttpPost]
        public async Task UpdateAccount(string Surname, string FirstName)
        {
            var user = await userManager.GetUserAsync(User);
            user.Surname = Surname;
            user.FirstName = FirstName;
            await userManager.UpdateAsync(user);
        }

        [HttpPost]
        public async Task LogOut()
        {
            await signInManager.SignOutAsync();
        }






        public string LoggedIn()
        {
            return JsonConvert.SerializeObject(User.Identity.IsAuthenticated);
        }

        public async Task<string> GetMail() => await userManager.GetEmailAsync(await userManager.GetUserAsync(User));

        public async Task<UserInfo> GetClientChatInfo()
        {
            //user is defined by email
            var user = await userManager.GetUserAsync(User);
            var lst = new List<AppUser> { user };
            return UserInfo.GetChatInfos(context, lst, user)[0];
        }

        public async Task<UserInfo> GetClientAccountInfo()
        {
            var user = await userManager.GetUserAsync(User);
            var lst = new List<AppUser> { user };
            return (await UserInfo.GetManageInfos(userManager, lst))[0];
        }

        public async Task<bool> Confirmed()
        {
            var user = await userManager.GetUserAsync(User);
            return user.EmailConfirmed;
        }
    }
}
