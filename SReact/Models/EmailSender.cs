using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity.UI.Services;
using MailKit.Net.Smtp;
using MimeKit;
using MailKit.Security;
using System.Web;

namespace SReact.Models
{
    public class EmailSender : IEmailSender
    {
        private readonly string SenderMail = "antrongdn2022@gmail.com";
        private readonly string SenderPassword = "qkccshapsaqdbzwo";
        private readonly string SenderName;

        public async Task SendEmailAsync(string toAddress, string subject = "-Subject", string body = "-Body-")
        {
            var mail = new MimeMessage
            {
                Sender = new MailboxAddress(SenderName, SenderMail),
                Subject = subject,
                Body = new BodyBuilder { HtmlBody = HttpUtility.HtmlDecode(body) }.ToMessageBody()
            };
            mail.From.Add(mail.Sender);
            mail.To.Add(MailboxAddress.Parse(toAddress));
            using (var smtp = new SmtpClient())
            {
                try
                {
                    smtp.Connect("smtp.gmail.com", 25, SecureSocketOptions.StartTls);
                    smtp.Authenticate(SenderMail, SenderPassword);
                    await smtp.SendAsync(mail);
                }
                catch (Exception e)
                {
                    System.Diagnostics.Debug.WriteLine(e.Message);
                }
                smtp.Disconnect(true);
            }
        }
    }
}
