export function passwordChangedEmailSubject(): string {
  return 'Your password was changed';
}

export function passwordChangedEmailHtml(): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p>Your password was just changed.</p>
      <p>If you made this change, no further action is needed. If you didn't, reset your password immediately and contact support.</p>
    </div>
  `;
}
