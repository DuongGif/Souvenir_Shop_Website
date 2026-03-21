namespace Souvenir_Shop_Website.Services
{
	public interface IBankTransferService
	{
		string BuildQrUrl(string bankId, string accountNo, string accountName, decimal amount, string transferContent);
	}

	public class BankTransferService : IBankTransferService
	{
		public string BuildQrUrl(string bankId, string accountNo, string accountName, decimal amount, string transferContent)
		{
			var amountValue = ((long)amount).ToString();
			var addInfo = Uri.EscapeDataString(transferContent);
			var accountNameEncoded = Uri.EscapeDataString(accountName);

			return $"https://img.vietqr.io/image/{bankId}-{accountNo}-compact2.png?amount={amountValue}&addInfo={addInfo}&accountName={accountNameEncoded}";
		}
	}
}