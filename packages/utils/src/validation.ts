export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(phone.replace(/\s/g, ''));
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}

export function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}
