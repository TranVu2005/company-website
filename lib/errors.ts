// Lấy message an toàn từ giá trị catch được (kiểu unknown, không phải Error
// trong mọi trường hợp — vd throw string/object bất kỳ).
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
