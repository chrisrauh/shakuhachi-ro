import { getCurrentUser, onAuthStateChange } from './auth';
import type { User, Session } from '@supabase/supabase-js';

export class AuthStateManager {
  private static instance: AuthStateManager;
  private user: User | null = null;
  private session: Session | null = null;
  private listeners: Array<
    (user: User | null, session: Session | null) => void
  > = [];

  private constructor() {
    this.initialize();
  }

  public static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager();
    }
    return AuthStateManager.instance;
  }

  private async initialize(): Promise<void> {
    const { user } = await getCurrentUser();
    this.user = user;

    onAuthStateChange((user, session, event) => {
      const userChanged = this.user?.id !== user?.id;

      // Always update internal state
      this.user = user;
      this.session = session;

      // Only notify if state actually changed (prevents duplicate callbacks from INITIAL_SESSION)
      // subscribe() already fired immediately when registered, so we only notify on real changes
      if (userChanged) {
        this.notifyListeners();
      } else if (event !== 'INITIAL_SESSION') {
        // If user didn't change but it's not INITIAL_SESSION, still notify (e.g., TOKEN_REFRESHED)
        this.notifyListeners();
      }
      // else: Skip notification for INITIAL_SESSION when user hasn't changed
    });
  }

  public getUser(): User | null {
    return this.user;
  }

  public getSession(): Session | null {
    return this.session;
  }

  public isAuthenticated(): boolean {
    return this.user !== null;
  }

  public subscribe(
    callback: (user: User | null, session: Session | null) => void,
  ): () => void {
    // Fire immediately with current state so components don't miss initial auth state
    callback(this.user, this.session);

    // Add to listeners for future updates
    this.listeners.push(callback);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.user, this.session));
  }
}

export const authState = AuthStateManager.getInstance();
