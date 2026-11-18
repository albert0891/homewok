import * as Crypto from 'expo-crypto';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { type Household, useHousehold, useSaveChanges } from '@/data/household';
import { type Day, toDay } from '@/features/kitchen/dates';
import { kitchenSections } from '@/features/kitchen/kitchenList';
import { space, type, useColors } from '@/theme/theme';

import { loadSampleKitchen, SAMPLE_FOOD_COUNT } from './sampleKitchen';

/**
 * One line on what the kitchen holds now, counted by the Kitchen list's own sections:
 * "Kitchen now: Fridge 11, Freezer 5, Pantry 5, Staples 12." It comes from what screens
 * show, so a change the database refuses drops out of it too.
 */
function kitchenNow({ data, error }: Household, today: Day): string {
  if (!data) {
    return error ? 'The kitchen couldn’t be loaded.' : 'Loading the kitchen…';
  }

  const sections = kitchenSections(data, today);
  if (sections.length === 0) {
    return 'The kitchen is empty.';
  }
  const counts = sections.map((section) => `${section.title} ${section.data.length}`);
  return `Kitchen now: ${counts.join(', ')}.`;
}

/**
 * The Developer part of the Settings sheet: Load sample kitchen, and what the kitchen
 * holds now. The Settings sheet shows it in development builds only.
 */
export function SampleKitchenSection() {
  const colors = useColors();
  const household = useHousehold();
  const save = useSaveChanges();

  function confirmLoad() {
    const { data } = household;
    // The button stays, and says on tap what is missing (design/components/Button.md).
    if (!data) {
      Alert.alert('The kitchen hasn’t loaded yet', 'Try again in a moment.');
      return;
    }

    Alert.alert(
      'Load sample kitchen?',
      `Adds ${SAMPLE_FOOD_COUNT} foods with dates counted from today, and sets a few staples to Low or Out. ` +
        'Purchases of these foods already in your kitchen are replaced.',
      [
        { text: 'Cancel', style: 'cancel' },
        // One action, so it shows at once and waits in the queue like any other edit.
        { text: 'Load', onPress: () => save(loadSampleKitchen(data, toDay(new Date()), Crypto.randomUUID)) },
      ],
    );
  }

  return (
    <View style={styles.section}>
      <Text style={[type.subhead, { color: colors.inkMuted }]}>Developer</Text>
      <Button label="Load sample kitchen" onPress={confirmLoad} />
      <Text style={[type.footnote, { color: colors.inkMuted }]}>
        {kitchenNow(household, toDay(new Date()))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space[2],
  },
});
