import React from 'react'; // needed for JSX
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
  Star,
  BookOpen,
  Users,
  Heart,
  Gift,
  ShoppingBag,
  Settings,
  Globe,
  LogOut,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/components/ui';
import { webPointer } from '@/lib/adminStyles';

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

interface NavItem {
  label: string;
  route: string;
  Icon: IconComponent;
}

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { settings } = useSettings();

  const navItems: NavItem[] = [
    { label: 'כיתות',       route: '/admin/classes',     Icon: BookOpen    },
    { label: 'מורים',       route: '/admin/teachers',    Icon: Users       },
    { label: 'מעשים טובים', route: '/admin/deeds',       Icon: Heart       },
    { label: 'מתנות לכיתה', route: '/admin/gifts',       Icon: Gift        },
    { label: 'פדיונות',     route: '/admin/redemptions', Icon: ShoppingBag },
    { label: 'הגדרות',      route: '/admin/settings',    Icon: Settings    },
  ];

  function isActive(route: string) {
    return pathname === route || pathname.startsWith(route + '/');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  }

  return (
    <View style={S.sidebar}>
      {/* ── Logo ── */}
      <TouchableOpacity
        onPress={() => router.push('/admin')}
        style={[S.logoSection, webPointer]}
        accessibilityRole="button"
        accessibilityLabel="עבור לדף הבית של ממשק הניהול"
      >
        <View style={S.logoBox}>
          <Star size={20} color="#fff" />
        </View>
        <View style={S.logoText}>
          <Text style={S.schoolName} numberOfLines={1}>
            {settings?.school_name ?? 'בית הספר'}
          </Text>
          <Text style={S.adminLabel}>ממשק ניהול</Text>
        </View>
      </TouchableOpacity>

      <View style={S.divider} />

      {/* ── Nav items ── */}
      <View style={S.navList}>
        {navItems.map((item) => {
          const active = isActive(item.route);
          const iconColor = active ? Colors.primary : '#64748b';
          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={[S.navItem, active && S.navItemActive, webPointer]}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
            >
              <View style={S.navIcon}>
                <item.Icon size={18} color={iconColor} />
              </View>
              <Text style={[S.navLabel, active && S.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Bottom section ── */}
      <View style={S.bottom}>
        <View style={S.divider} />

        {/* Public view */}
        <TouchableOpacity
          onPress={() => router.push('/')}
          style={[S.navItem, webPointer]}
          accessibilityRole="button"
          accessibilityLabel="עבור לתצוגה הציבורית"
        >
          <View style={S.navIcon}>
            <Globe size={18} color="#64748b" />
          </View>
          <Text style={S.navLabel}>תצוגה ציבורית</Text>
        </TouchableOpacity>

        <View style={S.divider} />

        {/* User info + logout */}
        <View style={S.userRow}>
          <View style={S.userInfo}>
            <Text style={S.userName} numberOfLines={1}>
              {user?.display_name ?? ''}
            </Text>
            <Text style={S.userEmail} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={[S.logoutBtn, webPointer]}
            accessibilityRole="button"
            accessibilityLabel="התנתק מהמערכת"
          >
            <LogOut size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    flex: 1,
  },

  // ── Logo ──
  logoSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    flex: 1,
  },
  schoolName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
  } as any,
  adminLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 1,
  } as any,

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 0,
  },

  // ── Nav ──
  navList: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 2,
    minHeight: 44,
  },
  navItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  navIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActive: {},
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
  } as any,
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  } as any,

  // ── Bottom ──
  bottom: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  userRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  userEmail: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 1,
  } as any,
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
