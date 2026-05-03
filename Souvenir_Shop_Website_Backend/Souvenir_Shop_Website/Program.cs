using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Souvenir_Shop_Website.Models;
using Souvenir_Shop_Website.Services;
using System.Text;
using Souvenir_Shop_Website.Options;

namespace Souvenir_Shop_Website
{
	public class Program
	{
		public static void Main(string[] args)
		{
			var builder = WebApplication.CreateBuilder(args);

			builder.Services.Configure<BankTransferOptions>(
			builder.Configuration.GetSection("Payments:BankTransfer"));

			builder.Services.AddScoped<IBankTransferService, BankTransferService>();

			// MVC + API
			builder.Services.AddControllersWithViews();
			builder.Services.AddControllers();

			// DbContext
			builder.Services.AddDbContext<SouvenirShopContext>(options =>
				options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

			// Session
			builder.Services.AddSession(options =>
			{
				options.IdleTimeout = TimeSpan.FromMinutes(30);
				options.Cookie.HttpOnly = true;
				options.Cookie.IsEssential = true;
			});

			// ✅ CORS for React (Vite)
			builder.Services.AddCors(options =>
			{
				options.AddPolicy("AllowReact", policy =>
				{
					policy.WithOrigins(
							"http://localhost:5173",  // React Vite
							"http://localhost:3000"   // nếu bạn chạy React port 3000
						)
						.AllowAnyHeader()
						.AllowAnyMethod();
					// Nếu sau này bạn dùng cookie auth thì thêm:
					// .AllowCredentials();
				});
			});

			// Swagger
			builder.Services.AddEndpointsApiExplorer();
			builder.Services.AddSwaggerGen();

			// JWT token service
			builder.Services.AddScoped<JwtTokenService>();

			// JWT Authentication
			var jwtSection = builder.Configuration.GetSection("Jwt");
			var jwtKey = jwtSection["Key"]!;
			var jwtIssuer = jwtSection["Issuer"]!;
			var jwtAudience = jwtSection["Audience"]!;

			builder.Services
				.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
				.AddJwtBearer(options =>
				{
					options.RequireHttpsMetadata = false; // dev
					options.SaveToken = true;

					options.TokenValidationParameters = new TokenValidationParameters
					{
						ValidateIssuer = true,
						ValidIssuer = jwtIssuer,

						ValidateAudience = true,
						ValidAudience = jwtAudience,

						ValidateIssuerSigningKey = true,
						IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

						ValidateLifetime = true,
						ClockSkew = TimeSpan.FromSeconds(10)
					};
				});
			builder.Services.AddHttpClient();

			builder.Services.AddAuthorization();

			builder.Services.Configure<SmtpOptions>(
			builder.Configuration.GetSection("Smtp"));
			builder.Services.AddScoped<OtpService>();
			builder.Services.AddScoped<EmailService>();

			builder.Services.Configure<GeminiOptions>(
			builder.Configuration.GetSection("Gemini"));
			builder.Services.AddScoped<GeminiTranslateService>();


			var app = builder.Build();
				app.UseStaticFiles();

			if (app.Environment.IsDevelopment())
			{
				app.UseSwagger();
				app.UseSwaggerUI();
			}
			else
			{
				app.UseExceptionHandler("/Home/Error");
				app.UseHsts();
			}

			app.UseHttpsRedirection();
			app.UseStaticFiles();

			app.UseRouting();

			// ✅ Apply CORS here (before auth)
			app.UseCors("AllowReact");

			app.UseSession();

			// Authentication before Authorization
			app.UseAuthentication();
			app.UseAuthorization();

			// API Controllers
			app.MapControllers();

			// MVC Views
			app.MapControllerRoute(
				name: "default",
				pattern: "{controller=Home}/{action=Index}/{id?}");

			app.Run();
		}
	}
}