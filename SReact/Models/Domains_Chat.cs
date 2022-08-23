using System;
using System.Collections.Generic;

namespace SReact.Models
{
    public class Friend
    {
        public int Id { get; set; }
        public AppUser User1 { get; set; }          //Send request
        public AppUser User2 { get; set; }          //Accept request
        public string Status { get; set; }          //ex: 1block2, 2block1
    }

    public class ChatGroup
    {
        public int ChatGroupId { get; set; }
        public string GroupName { get; set; }
        public AppUser GroupAdmin { get; set; }
        public ICollection<AppUser> Members { get; set; }       //Many - Many
    }





    // General: Id - From - To(Source) - Content (File, Tag) - Time - Reaction (Comment)

    public class ChatRecord
    {
        public int ChatRecordId { get; set; }
        public AppUser Sender { get; set; }
        public AppUser PrivateTo { get; set; }                  //nullable
        public ChatGroup GroupTo { get; set; }                  //nullable
        public string Message { get; set; }
        public DateTime Time { get; set; }
        public ICollection<Reaction> Reactions { get; set; }    //One - Many
        public string File { get; set; }                        //concat
    }
    
    public class Post
    {
        public int PostId { get; set; }
        public AppUser Author { get; set; }
        public string Restriction { get; set; }
        public string Content { get; set; }
        public string File { get; set; }                        //concat
        public ICollection<TagPost> TagPosts { get; set; }      //Many - Many
        public DateTime Time { get; set; }
        public ICollection<Comment> Comments { get; set; }      //One - Many
        public ICollection<Reaction> Reactions { get; set; }    //One - Many
    }

    public class Notification
    {
        public int NotificationId { get; set; }
        public AppUser Sender { get; set; }
        public AppUser Receiver { get; set; }
        public string Message { get; set; }
        public DateTime Time { get; set; }
        public string Type { get; set; }            //ex: Friend
        public string Status { get; set; }          //ex: Accepted, Seen
        public string Link { get; set; }            //link
    }
    
    public class Reaction
    {
        public int ReactionId { get; set; }                 //for ChatRecord & Post
        public AppUser Author { get; set; }
        public ChatRecord SrcChatRecord { get; set; }       //nullable
        public Post SrcPost { get; set; }                   //nullable
        public string React { get; set; }
    }

    public class Comment
    {
        public int CommentId { get; set; }                      //for Post
        public AppUser Author { get; set; }
        public Post SrcPost { get; set; }                       //nullable
        public Comment SrcComment { get; set; }                 //nullable
        public string Content { get; set; }
        public string File { get; set; }                        //concat
        public DateTime Time { get; set; }
        public ICollection<Reply> Replies { get; set; }         //One - Many
        public ICollection<Reaction> Reactions { get; set; }
    }

    public class Tag {
        public int TagId { get; set;}                           //for Post
        public string TagName { get; set; }
        public ICollection<TagPost> TagPosts { get; set; }      //Many - Many
    }







    public class Reply
    {
        public int Id { get; set; }
        public Comment Source { get; set; }
        public Comment Response { get; set; }
    }

    public class TagPost
    {
        public int TagId { get; set; }
        public int PostId { get; set; }
        public Tag Tag { get; set; }
        public Post Post { get; set; }
    }
}
