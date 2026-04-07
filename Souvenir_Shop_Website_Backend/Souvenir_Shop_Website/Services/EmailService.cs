using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace Souvenir_Shop_Website.Services;

public class EmailService
{
	private readonly SmtpOptions _smtpOptions;

	public EmailService(IOptions<SmtpOptions> smtpOptions)
	{
		_smtpOptions = smtpOptions.Value;
	}

	public async Task SendHtmlAsync(string toEmail, string subject, string htmlBody)
	{
		if (string.IsNullOrWhiteSpace(_smtpOptions.Host) ||
			string.IsNullOrWhiteSpace(_smtpOptions.Username) ||
			string.IsNullOrWhiteSpace(_smtpOptions.Password) ||
			string.IsNullOrWhiteSpace(_smtpOptions.FromEmail))
		{
			throw new InvalidOperationException("SMTP configuration is missing.");
		}

		using var message = new MailMessage
		{
			From = new MailAddress(_smtpOptions.FromEmail, _smtpOptions.FromName ?? "SouVN"),
			Subject = subject,
			Body = htmlBody,
			IsBodyHtml = true
		};

		message.To.Add(toEmail);

		using var client = new SmtpClient(_smtpOptions.Host, _smtpOptions.Port)
		{
			Credentials = new NetworkCredential(_smtpOptions.Username, _smtpOptions.Password),
			EnableSsl = _smtpOptions.EnableSsl
		};

		await client.SendMailAsync(message);
	}
}