namespace SellPoint.API.Models
{
    public class VendorDocument
    {
        public int DocumentID { get; set; }
        public int UserID { get; set; }
        public string DocumentType { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public int? FileSize { get; set; }
        public string? ContentType { get; set; }
        public DateTime UploadedDate { get; set; }
        public bool IsVerified { get; set; }
    }

    public class UploadDocumentModel
    {
        public string DocumentType { get; set; }
        public IFormFile File { get; set; }
    }
}