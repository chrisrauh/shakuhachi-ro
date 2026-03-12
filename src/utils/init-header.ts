import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { AuthWidget } from '../components/AuthComponents';

export function initHeader() {
  new ThemeSwitcher('theme-switcher');

  if (import.meta.env.DEV) {
    import('../components/LetterSpacingControl').then(
      ({ LetterSpacingControl }) => {
        new LetterSpacingControl('letter-spacing-control');
      },
    );
  }

  const authWidget = new AuthWidget('auth-widget');
  const authModal = authWidget.getAuthModal();

  return { authWidget, authModal };
}
