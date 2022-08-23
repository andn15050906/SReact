using System;
using System.Collections.Generic;

namespace SReact.Models
{
    public class PostInfo
    {
        public int PostId;
        public AppUser Author;
        public string Restriction;
        public string Content;
        public string File;
        public List<string> Tags;
        public DateTime Time;
        public List<int> CommentIds;
        public List<int> ReactionIds;
    }
}
