import {
  createElement,
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
import { AuthWidget } from '../components/AuthComponents';
import { AuthModal } from '../components/AuthModal';
import { MobileMenu, type MenuItem } from '../components/MobileMenu';
import { onAuthReady, signOut } from '../api/auth';
import { createEmptyScore } from './create-score-handler';
import { toast } from '../components/Toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function getIconHTML(
  iconComponent: Parameters<typeof createElement>[0],
): string {
  const icon = createElement(iconComponent);
  icon.setAttribute('width', '16');
  icon.setAttribute('height', '16');
  icon.setAttribute('stroke-width', '2');
  return icon.outerHTML;
}

export function buildNavItems(): MenuItem[] {
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
      action: async () => {
        const result = await createEmptyScore();
        if (result.error) {
          toast.error(result.error.message, { duration: Infinity });
        } else {
          window.location.href = `/score/${result.slug}/edit`;
        }
      },
      icon: getIconHTML(Plus),
    },
  ];
}

export function buildAuthItems(
  user: SupabaseUser | null,
  authModal: AuthModal,
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
  authModal: AuthModal,
): MenuItem[][] {
  return [
    buildNavItems(),
    buildAuthItems(user, authModal),
    buildUtilityItems(),
  ];
}

function scoreEditMenuBuilder(
  user: SupabaseUser | null,
  authModal: AuthModal,
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
    buildNavItems(),
    buildAuthItems(user, authModal),
    buildUtilityItems(),
  ];
}

const MENU_BUILDERS: Record<
  string,
  (user: SupabaseUser | null, authModal: AuthModal) => MenuItem[][]
> = {
  standard: standardMenuBuilder,
  'score-edit': scoreEditMenuBuilder,
};

export function initHeader(): void {
  new ThemeSwitcher('theme-switcher');

  if (import.meta.env.DEV) {
    import('../components/LetterSpacingControl').then(
      ({ LetterSpacingControl }) => {
        new LetterSpacingControl('letter-spacing-control');
      },
    );
  }

  const authModal = new AuthModal();
  const authWidget = new AuthWidget('auth-widget', authModal);
  const mobileMenu = new MobileMenu('mobile-menu');

  const menuContainer = document.getElementById('mobile-menu');
  const menuType = menuContainer?.dataset.menuType ?? 'standard';
  const builder = MENU_BUILDERS[menuType] ?? standardMenuBuilder;

  onAuthReady((user) => {
    authWidget.setUser(user);
    mobileMenu.setItems(builder(user, authModal));
  });
}
