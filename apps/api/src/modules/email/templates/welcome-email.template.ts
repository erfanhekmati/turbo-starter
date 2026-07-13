export function welcomeEmailSubject(): string {
  return 'Welcome aboard';
}

export function welcomeEmailHtml(firstName: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p>Hi ${firstName},</p>
      <p>Your account is ready. You can sign in whenever you're ready.</p>
      <p>If you didn't create this account, contact support.</p>
    </div>
  `;
}
