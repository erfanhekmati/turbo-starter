export function accountLockedEmailSubject(): string {
  return 'Your account has been temporarily locked';
}

export function accountLockedEmailHtml(lockoutMinutes: number): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p>Your account was temporarily locked after too many failed sign-in attempts.</p>
      <p>You can try again in about ${lockoutMinutes} minutes. If this wasn't you, reset your password.</p>
    </div>
  `;
}
