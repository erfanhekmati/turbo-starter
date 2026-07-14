'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Navbar, SidebarNav, toast } from '@repo/ui';
import {
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { useCurrentUser } from '@/features/auth';
import { getApiClient } from '@/lib/api';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();

  async function handleLogout() {
    try {
      await getApiClient().auth.logout();
    } catch {
      // ignore and continue clearing the local session
    }

    toast.success('Signed out');
    router.replace('/login');
    router.refresh();
  }

  const items = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="size-4" />,
      active: pathname.startsWith('/dashboard'),
    },
    {
      label: 'Users',
      href: '/users',
      icon: <Users className="size-4" />,
      active: pathname.startsWith('/users'),
    },
    {
      label: 'Audit',
      href: '/audit',
      icon: <Shield className="size-4" />,
      active: pathname.startsWith('/audit'),
    },
    {
      label: 'Files',
      href: '/files',
      icon: <FileText className="size-4" />,
      active: pathname.startsWith('/files'),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="size-4" />,
      active: pathname.startsWith('/settings'),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        logo={<Link href="/dashboard">Turbo Starter Admin</Link>}
        actions={
          <div className="flex items-center gap-3">
            {user ? (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.firstName} {user.lastName}
                {user.roles.length > 0 ? ` · ${user.roles.join(', ')}` : ''}
              </span>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        }
      />
      <div className="flex flex-1">
        <SidebarNav
          items={items}
          renderLink={(item, content) => (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          )}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
