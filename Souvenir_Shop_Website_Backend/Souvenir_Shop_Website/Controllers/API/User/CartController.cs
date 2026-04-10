using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Cart;
using Souvenir_Shop_Website.Helpers;
using Souvenir_Shop_Website.Models;

namespace Souvenir_Shop_Website.Controllers.API.User;

[Authorize]
[ApiController]
[Route("api/cart")]
public class CartController : ControllerBase
{
	private readonly SouvenirShopContext _db;
	public CartController(SouvenirShopContext db) => _db = db;

	// GET /api/cart
	[HttpGet]
	public async Task<ActionResult<CartDto>> GetCart()
	{
		var userId = CurrentUser.GetUserId(User);

		var cart = await _db.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
		if (cart == null)
			return Ok(new CartDto
			{
				CartId = 0,
				Items = new(),
				Subtotal = 0
			});

		var items = await (
			from ci in _db.CartItems
			join v in _db.ProductVariants on ci.VariantId equals v.Id
			join p in _db.Products on v.ProductId equals p.Id
			where ci.CartId == cart.Id
			select new CartItemDto
			{
				Id = ci.Id,
				VariantId = ci.VariantId,
				ProductSlug = p.Slug,
				VariantName = v.VariantName,
				Price = v.Price ?? 0,
				Quantity = ci.Quantity,
				LineTotal = (v.Price ?? 0) * ci.Quantity,
				ImageUrl = _db.ProductImages
					.Where(pi => pi.ProductId == p.Id)
					.OrderBy(pi => pi.Id)
					.Select(pi => pi.ImageUrl)
					.FirstOrDefault()
			}
		)
		.AsNoTracking()
		.ToListAsync();

		return Ok(new CartDto
		{
			CartId = cart.Id,
			Items = items,
			Subtotal = items.Sum(x => x.LineTotal)
		});
	}

	// POST /api/cart/items
	[HttpPost("items")]
	public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest req)
	{
		if (req.Quantity <= 0)
			return BadRequest("Số lượng phải lớn hơn 0.");

		var userId = CurrentUser.GetUserId(User);

		var cart = await _db.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
		if (cart == null)
		{
			cart = new Cart
			{
				UserId = userId,
				CreatedAt = DateTime.Now
			};
			_db.Carts.Add(cart);
			await _db.SaveChangesAsync();
		}

		var existing = await _db.CartItems
			.FirstOrDefaultAsync(x => x.CartId == cart.Id && x.VariantId == req.VariantId);

		if (existing != null)
		{
			existing.Quantity += req.Quantity;
		}
		else
		{
			_db.CartItems.Add(new CartItem
			{
				CartId = cart.Id,
				VariantId = req.VariantId,
				Quantity = req.Quantity,
				CreatedAt = DateTime.Now
			});
		}

		await _db.SaveChangesAsync();
		return Ok(new { message = "Đã thêm sản phẩm vào giỏ hàng." });
	}

	// PUT /api/cart/items/{itemId}
	[HttpPut("items/{itemId:long}")]
	public async Task<IActionResult> UpdateItem(long itemId, [FromBody] UpdateCartItemRequest req)
	{
		if (req.Quantity <= 0)
			return BadRequest("Số lượng phải lớn hơn 0.");

		var userId = CurrentUser.GetUserId(User);

		var item = await (
			from ci in _db.CartItems
			join c in _db.Carts on ci.CartId equals c.Id
			where ci.Id == itemId && c.UserId == userId
			select ci
		).FirstOrDefaultAsync();

		if (item == null)
			return NotFound("Không tìm thấy sản phẩm trong giỏ hàng.");

		item.Quantity = req.Quantity;
		await _db.SaveChangesAsync();

		return Ok(new { message = "Cập nhật giỏ hàng thành công." });
	}

	// DELETE /api/cart/items/{itemId}
	[HttpDelete("items/{itemId:long}")]
	public async Task<IActionResult> DeleteItem(long itemId)
	{
		var userId = CurrentUser.GetUserId(User);

		var item = await (
			from ci in _db.CartItems
			join c in _db.Carts on ci.CartId equals c.Id
			where ci.Id == itemId && c.UserId == userId
			select ci
		).FirstOrDefaultAsync();

		if (item == null)
			return NotFound("Không tìm thấy sản phẩm trong giỏ hàng.");

		_db.CartItems.Remove(item);
		await _db.SaveChangesAsync();

		return Ok(new { message = "Xóa sản phẩm khỏi giỏ hàng thành công." });
	}
}