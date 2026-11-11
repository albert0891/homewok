import { NativeTabs } from 'expo-router/native-tabs';
import type { SFSymbol } from 'expo-symbols';

import { useColors } from '@/theme/theme';

/**
 * The four tabs, in order. `name` is the route file in this folder, and `icon` is
 * an SF Symbol, Apple's built-in icon set.
 */
const TABS: { name: string; label: string; icon: SFSymbol }[] = [
  { name: 'index', label: 'Tonight', icon: 'fork.knife' },
  { name: 'kitchen', label: 'Kitchen', icon: 'refrigerator.fill' },
  { name: 'shopping', label: 'Shopping', icon: 'cart.fill' },
  { name: 'recipes', label: 'Recipes', icon: 'book.fill' },
];

/** The native iOS tab bar. It keeps Apple's own look, with persimmon for the active tab. */
export default function TabsLayout() {
  const colors = useColors();

  return (
    <NativeTabs tintColor={colors.accent}>
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon sf={tab.icon} />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
