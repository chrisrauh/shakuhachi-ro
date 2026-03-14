import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { AuthWidget, HeaderModal } from '../components/AuthComponents';

export function initHeader() {
  new ThemeSwitcher('theme-switcher');

  if (import.meta.env.DEV) {
    import('../components/LetterSpacingControl').then(
      ({ LetterSpacingControl }) => {
        new LetterSpacingControl('letter-spacing-control');
      },
    );
  }

  const headerModal = new HeaderModal();
  const authWidget = new AuthWidget('auth-widget', headerModal);

  return { authWidget, headerModal };
}
