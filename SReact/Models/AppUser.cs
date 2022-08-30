using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;
using System;

namespace SReact.Models
{
    /* Ask for Gender, DateOfBirth
     * Allow changing Avatar, CoverImg
     * LastSeen
     */
    public class AppUser : IdentityUser
    {
        [PersonalData]
        public string AppUserId { get; set; }
        [PersonalData]
        public string FirstName { get; set; }
        [PersonalData]
        public string Surname { get; set; }
        [PersonalData]
        public string Avatar { get; set; }                                      //url
        [PersonalData]
        public string CoverImg { get; set; }                                    //url
        [PersonalData]
        public string Gender { get; set; }
        [PersonalData]
        public DateTime DateOfBirth { get; set; }

        public ICollection<Member_ChatGroup> Member_ChatGroups { get; set; }    //many-many
    }
}
