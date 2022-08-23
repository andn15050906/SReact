using Microsoft.AspNetCore.Identity;

namespace SReact.Models
{
    public class AppUser : IdentityUser
    {
        [PersonalData]
        public string AppUserId { get; set; }
        [PersonalData]
        public string FirstName { get; set; }
        [PersonalData]
        public string Surname { get; set; }
        [PersonalData]
        public string Avatar { get; set; }      //url
        [PersonalData]
        public string CoverImg { get; set; }    //url
        [PersonalData]
        public string Gender { get; set; }
    }
}
