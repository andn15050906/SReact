using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace SReact.Models
{
    public class Context : IdentityDbContext<AppUser>
    {
        public Context(DbContextOptions<Context> options) : base(options)
        {

        }

        public DbSet<Friend> Friends { get; set; }
        public DbSet<ChatGroup> ChatGroups { get; set; }

        public DbSet<ChatRecord> ChatRecords { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Reaction> Reactions { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Tag> Tags { get; set; }

        public DbSet<Reply> Replies { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Comment>()
                .HasMany<Reply>(c => c.Replies)
                .WithOne(r => r.Source);

            modelBuilder.Entity<TagPost>().HasKey(tagPost => new { tagPost.TagId, tagPost.PostId });
            modelBuilder.Entity<TagPost>()
                .HasOne<Tag>(tp => tp.Tag)
                .WithMany(tag => tag.TagPosts)
                .HasForeignKey(tp => tp.TagId);
            modelBuilder.Entity<TagPost>()
                .HasOne<Post>(tp => tp.Post)
                .WithMany(post => post.TagPosts)
                .HasForeignKey(tp => tp.PostId);
        }


        //Chat
        public int SendPrivate(AppUser sender, AppUser receiver, string message)
        {
            Attach(sender);
            Attach(receiver);
            ChatRecords.Add(new ChatRecord
            {
                Sender = sender,
                PrivateTo = receiver,
                Message = message,
                Time = DateTime.Now
            });
            SaveChanges();
            return ChatRecords.Last().ChatRecordId;
        }
        public IEnumerable<ChatRecord> GetChatRecords(string id1, string id2)
        {
            //explicit loading
            var records = ChatRecords.Where(ele => IsPermutation(ele.Sender.Id, ele.PrivateTo.Id, id1, id2));
            foreach (ChatRecord record in records)
            {
                Entry(record).Reference(ele => ele.Sender).Load();
                Entry(record).Reference(ele => ele.PrivateTo).Load();
            }
            return records.Select(ele => new ChatRecord
            {
                ChatRecordId = ele.ChatRecordId,
                Sender = new AppUser { Email = ele.Sender.Email, Avatar = ele.Sender.Avatar },
                PrivateTo = new AppUser { Email = ele.PrivateTo.Email },
                Message = ele.Message,
                File = ele.File,
                Time = ele.Time
            });
        }
        public void DeleteChatRecord(int id)
        {
            ChatRecords.Remove(ChatRecords.First(ele => ele.ChatRecordId == id));
            SaveChanges();
        }



        //Upload -> Explicit
        public string CreateChatFile(IFormFile file)
        {
            //Doesn't involve DB
            if (file != null)
            {
                SaveIfNotExist(file, file.FileName, @"wwwroot\upload-chat");
                return file.FileName;
            }
            return "";
        }
        public int UploadPrivate(AppUser sender, AppUser receiver, string file)
        {
            Attach(sender);
            Attach(receiver);
            ChatRecords.Add(new ChatRecord
            {
                Sender = sender,
                PrivateTo = receiver,
                File = file,
                Time = DateTime.Now
            });
            SaveChanges();
            return ChatRecords.Last().ChatRecordId;
        }



        //Notification
        public bool SendNotification(AppUser sender, AppUser receiver, string message, string type, string contact)
        {
            if (type == "friend")
            {
                //only 1 friend notify for 2
                if (Notifications.Any(ele => IsPermutation(ele.Sender.Email, ele.Receiver.Email, sender.Email, receiver.Email)))
                    return false;
            }
            Attach(sender);
            Attach(receiver);
            Notifications.Add(new Notification
            {
                Sender = sender,
                Receiver = receiver,
                Message = message,
                Time = DateTime.Now,
                Type = type,
                Link = contact
            });
            SaveChanges();
            return true;
        }
        public IEnumerable<Notification> GetNotifications(AppUser target, bool receiver)
        {
            IQueryable<Notification> records;
            if (receiver)
                records = Notifications.Where(ele => ele.Receiver.Id == target.Id);
            else
                records = Notifications.Where(ele => ele.Sender.Id == target.Id);
            foreach (Notification record in records)
            {
                Entry(record).Reference(ele => ele.Sender).Load();
                Entry(record).Reference(ele => ele.Receiver).Load();
            }
            return records.Select(ele => new Notification
            {
                NotificationId = ele.NotificationId,
                Sender = new AppUser { Email = ele.Sender.Email, Avatar = ele.Sender.Avatar },
                Receiver = new AppUser { Email = ele.Receiver.Email },
                Message = ele.Message,
                Time = ele.Time,
                Type = ele.Type,
                Status = ele.Status,
                Link = ele.Link
            });
        }
        public void UpdateNotification(int id, string status)
        {
            var notify = Notifications.Include(ele => ele.Sender).Include(ele => ele.Receiver).First(ele => ele.NotificationId == id);
            notify.Status = status;
            switch (status)
            {
                case "confirmed":
                    if (notify.Type == "friend")
                        Friends.Add(new Friend { User1 = notify.Sender, User2 = notify.Receiver, Status = "Normal" });
                    break;
            }
            SaveChanges();
        }
        public void DeleteNotification(Notification notify)
        {
            //doesn't pass id to avoid multiple queries
            Notifications.Remove(notify);
            SaveChanges();
        }



        //Friend
        public void AddFriend(AppUser user1, AppUser user2)
        {
            Attach(user1);
            Attach(user2);
            Friends.Add(new Friend
            {
                User1 = user1,
                User2 = user2,
                Status = "Friend"
            });
            SaveChanges();
        }
        public IEnumerable<AppUser> GetFriends(AppUser user)
        {
            var userLst = new List<AppUser>();
            var friendLst = Friends.Include(ele => ele.User1).Include(ele => ele.User2)
                .Where(ele => (ele.User1.Id == user.Id || ele.User2.Id == user.Id));
            /*
            Count() calls query
            for (int i = 0; i < 10; i++)
                System.Diagnostics.Debug.WriteLine(friendLst.Count());*/
            foreach (Friend friend in friendLst)
                userLst.Add(friend.User1.Id == user.Id ? friend.User2 : friend.User1);
            return userLst;
        }
        public bool AreFriends(string id1, string id2) => Friends.Any(ele => IsPermutation(ele.User1.Id, ele.User2.Id, id1, id2));
        //Update (status)
        public void RemoveFriend(AppUser user, string targetMail)
        {
            //bug case -> more than 1 record?
            //also handle deleteNotification
            var fr = Friends.FirstOrDefault(ele => IsPermutation(ele.User1.Email, ele.User2.Email, user.Email, targetMail));
            Friends.Remove(fr);
            Notifications.RemoveRange(Notifications.Include(ele => ele.Receiver).Include(ele => ele.Sender)
                .Where(ele => ele.Type == "friend" && IsPermutation(ele.Sender.Email, ele.Receiver.Email, user.Email, targetMail)));
            SaveChanges();
        }



        //Post
        public int CreatePost(Post _post, AppUser author, List<string> tags)
        {
            Attach(author);
            //EF doesn't generate entity for joining table
            //?? Without add, INSERT INTO (_post) still called when changing _post.TagPost
            Post post = new Post
            {
                Author = author,
                Restriction = _post.Restriction,
                Content = _post.Content,
                File = _post.File,
                Time = _post.Time,
                TagPosts = new List<TagPost>()
            };
            Posts.Add(post);                                                    //1.Add post to DB
            if (tags.Count() > 0)                                               //2.Add post to tag
            {
                string current;
                foreach (Tag tag in Tags)
                {
                    current = tag.TagName;
                    if (tags.Contains(current))                                 //  if the tag already exists, add post to tag
                    {
                        //check if this works
                        TagPost newTP = new TagPost { Post = post, Tag = tag };
                        //Load tag.TagPosts or use it as an empty array (below)?
                        tag.TagPosts = new List<TagPost> { newTP };
                        //tag.TagPosts.Add(newTP);
                        post.TagPosts.Add(newTP);
                        tags.Remove(current);                                   //    remove then continue with the remainings
                    }
                }
                foreach (string newTagName in tags)                             //  tags not found are new
                {
                    Tag newTag = new Tag { TagName = newTagName };
                    Tags.Add(newTag);
                    TagPost newTP = new TagPost { Post = post, Tag = newTag };
                    newTag.TagPosts = new List<TagPost> { newTP };
                    post.TagPosts.Add(newTP);
                }
            }
            SaveChanges();
            return Posts.Last().PostId;                                 // safe?
        }
        public string CreatePostFile(IFormFile file)
        {
            //Doesn't involve DB
            if (file != null)
            {
                SaveIfNotExist(file, file.FileName, @"wwwroot\upload-post");
                return file.FileName;
            }
            return "";
        }
        public IEnumerable<PostInfo> GetPosts(string authorId)
        {
            var lst = Posts.Include(ele => ele.Author).Include(ele => ele.TagPosts)
                .Where(ele => ele.Author.Id == authorId);
            List<PostInfo> result = new List<PostInfo>();
            foreach (Post ele in lst)
            {
                List<string> tags = new List<string>();
                foreach (TagPost tagpost in ele.TagPosts)
                {
                    Entry(tagpost).Reference(tp => tp.Tag).Load();
                    tags.Add(tagpost.Tag.TagName);
                }
                result.Add(new PostInfo {
                    PostId = ele.PostId,
                    Author = ele.Author,
                    Restriction = ele.Restriction,
                    Content = ele.Content,
                    File = ele.File,
                    Tags = tags,
                    Time = ele.Time,
                    CommentIds = new List<int>(),
                    ReactionIds = new List<int>()
                });
            }
            return result;
        }
        //delelePost
        //updatePost


        //add datetime to filename?
        bool SaveIfNotExist(IFormFile file, string fileName, string dir)
        {
            if (ExistInDirectory(fileName, dir))
                return false;
            using (var stream = File.Create(dir + @"\" + fileName))
            {
                file.CopyTo(stream);
            }
            return true;
        }
        bool ExistInDirectory(string file, string dir) => Directory.GetFiles(dir).Contains(dir + @"\" + file);
        public bool IsPermutation(string item1, string item2, string _item1, string _item2) => (item1 == _item1 && item2 == _item2 || item1 == _item2 && item2 == _item1);
    }
}
