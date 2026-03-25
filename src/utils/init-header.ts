import {
  Book,
  Plus,
  Info,
  HelpCircle,
  SunMoon,
  LogIn,
  LogOut,
  User,
  UserPlus,
  SquarePen,
  Trash2,
} from 'lucide';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import {
  AuthWidget,
  type AuthModalInterface,
} from '../components/AuthComponents';
import { AuthModal } from '../components/AuthModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MobileMenu, type MenuItem } from '../components/MobileMenu';
import { onAuthReady, signOut } from '../api/auth';
import { getIconHTML } from './icons';
import { startNewScore } from './create-score-handler';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function buildNavItems(authModal: AuthModalInterface): MenuItem[] {
  return [
    {
      id: 'browse',
      label: 'Library',
      href: '/',
      icon: getIconHTML(Book),
    },
    {
      id: 'create',
      label: 'Create score',
      action: () => startNewScore(authModal),
      icon: getIconHTML(Plus),
    },
  ];
}

export function buildAuthItems(
  user: SupabaseUser | null,
  authModal: AuthModalInterface,
): MenuItem[] {
  return user
    ? [
        {
          id: 'account',
          label: user.email || 'Account',
          nonInteractive: true,
          icon: getIconHTML(User),
        },
        {
          id: 'logout',
          label: 'Log Out',
          action: async () => {
            await signOut();
          },
          icon: getIconHTML(LogOut),
        },
      ]
    : [
        {
          id: 'login',
          label: 'Log In',
          action: () => authModal.show('login'),
          icon: getIconHTML(LogIn),
        },
        {
          id: 'signup',
          label: 'Sign Up',
          action: () => authModal.show('signup'),
          icon: getIconHTML(UserPlus),
        },
      ];
}

export function buildUtilityItems(): MenuItem[] {
  const toggleTheme = () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  };
  return [
    {
      id: 'theme',
      label: 'Toggle theme',
      action: toggleTheme,
      icon: getIconHTML(SunMoon),
    },
    {
      id: 'help',
      label: 'Help',
      href: '/help/notation-formats',
      icon: getIconHTML(HelpCircle),
    },
    {
      id: 'about',
      label: 'About',
      href: '/about',
      icon: getIconHTML(Info),
    },
  ];
}

function standardMenuBuilder(
  user: SupabaseUser | null,
  authModal: AuthModalInterface,
): MenuItem[][] {
  return [
    buildNavItems(authModal),
    buildAuthItems(user, authModal),
    buildUtilityItems(),
  ];
}

function scoreEditMenuBuilder(
  user: SupabaseUser | null,
  authModal: AuthModalInterface,
): MenuItem[][] {
  let isOwner = false;
  try {
    const dataEl = document.getElementById('score-data');
    if (dataEl) {
      const score = JSON.parse(dataEl.textContent || '{}').score;
      isOwner = !!(user && score && user.id === score.user_id);
    }
  } catch {
    // fall through: isOwner stays false, standard nav shown
  }

  const extraItems: MenuItem[] = isOwner
    ? [
        {
          id: 'edit',
          label: 'Edit score',
          href: (document.getElementById('edit-btn') as HTMLAnchorElement)
            ?.href,
          icon: getIconHTML(SquarePen),
        },
        {
          id: 'delete',
          label: 'Delete score',
          action: () =>
            (
              document.getElementById('delete-btn') as HTMLButtonElement
            )?.click(),
          icon: getIconHTML(Trash2),
        },
      ]
    : [];

  return [
    ...(extraItems.length > 0 ? [extraItems] : []),
    buildNavItems(authModal),
    buildAuthItems(user, authModal),
    buildUtilityItems(),
  ];
}

const MENU_BUILDERS: Record<
  string,
  (user: SupabaseUser | null, authModal: AuthModalInterface) => MenuItem[][]
> = {
  standard: standardMenuBuilder,
  'score-edit': scoreEditMenuBuilder,
};

// Module-level singleton — initialized by initHeader(), imported by call sites
export let confirmDialog: ConfirmDialog;

export function initHeader(): void {
  new ThemeSwitcher();

  if (import.meta.env.DEV) {
    import('../components/LetterSpacingControl').then(
      ({ LetterSpacingControl }) => {
        new LetterSpacingControl('letter-spacing-control');
      },
    );
  }

  const authModal = new AuthModal();
  confirmDialog = new ConfirmDialog();
  const authWidget = new AuthWidget('auth-widget', authModal);
  const mobileMenu = new MobileMenu('mobile-menu');

  const desktopCreateBtn = document.getElementById('desktop-create-btn');
  desktopCreateBtn?.addEventListener('click', () => startNewScore(authModal));

  const menuContainer = document.getElementById('mobile-menu');
  const menuType = menuContainer?.dataset.menuType ?? 'standard';
  const builder = MENU_BUILDERS[menuType] ?? standardMenuBuilder;

  onAuthReady((user) => {
    authWidget.setUser(user);
    mobileMenu.setItems(builder(user, authModal));
  });
}
