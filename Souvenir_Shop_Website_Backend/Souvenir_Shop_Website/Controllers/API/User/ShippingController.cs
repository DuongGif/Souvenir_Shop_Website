using Microsoft.AspNetCore.Mvc;

namespace Souvenir_Shop_Website.Controllers.API.User;

[ApiController]
[Route("api/shipping")]
public class ShippingController : ControllerBase
{
	[HttpGet("fee")]
	public IActionResult CalculateFee(
		string province,
		string? district = null)
	{
		decimal fee = 40000;

		province = province?.Trim() ?? "";

		switch (province)
		{
			case "Hà Nội":

				if (district == "Quận Cầu Giấy" ||
					district == "Quận Hoàn Kiếm")
				{
					fee = 15000;
				}
				else
				{
					fee = 25000;
				}

				break;

			case "Hồ Chí Minh":
				fee = 50000;
				break;

			case "Đà Nẵng":
				fee = 25000;
				break;

			default:
				fee = 40000;
				break;
		}

		return Ok(new
		{
			shippingFee = fee
		});
	}
}
