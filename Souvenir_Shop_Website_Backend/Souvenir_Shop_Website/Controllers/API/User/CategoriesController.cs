using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SouvenirShop.DTOs.Category;
using Souvenir_Shop_Website.Models;
using Microsoft.AspNetCore.Authorization;

namespace Souvenir_Shop_Website.Controllers.API.User;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly SouvenirShopContext _db;
    public CategoriesController(SouvenirShopContext db) => _db = db;

    // GET /api/categories
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        var data = await _db.Categories.AsNoTracking()
            .Where(c => c.IsVisible == true)
            .OrderBy(c => c.Id)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Slug = c.Slug
            })
            .ToListAsync();

        return Ok(data);
    }
}