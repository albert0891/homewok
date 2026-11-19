import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  type TextInputInstance,
  useWindowDimensions,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Stepper } from '@/components/Stepper';
import { TextField } from '@/components/TextField';
import { Title } from '@/components/Title';
import { useHousehold, useSaveChanges } from '@/data/household';
import { STORAGES } from '@/data/storages';
import { type UnitId, unitOf } from '@/data/units';
import { space, STACKED_TEXT_SCALE, type, useColors } from '@/theme/theme';

import { formatQuantity } from './amounts';
import { useByText } from './dates';
import { type Draft, EMPTY_DRAFT, purchaseFrom, sheetFor, stepped } from './sheetDraft';
import { addPurchase } from './stock';
import { useToday } from './useToday';

/** The longest food name the database takes. */
const NAME_LENGTH = 80;

/** Fridge, Freezer, and Pantry, in the Kitchen list's order. */
const STORAGE_OPTIONS = STORAGES.map((storage) => ({ value: storage.id, label: storage.label }));

/** Amounts closer than this are the same, so a one-tap amount shows as picked. */
const SAME_AMOUNT = 1e-9;

/**
 * The edit sheet, for now the way to add a food by hand (HW-12). It runs on the phone
 * with no AI call. What it shows is worked out in sheetDraft.ts, and Save goes through
 * the same rule as every purchase (addPurchase) and the same queue as every change: the
 * Kitchen shows the food at once, and a save the database refuses is undone with an alert.
 */
export function EditSheet() {
  const colors = useColors();
  const router = useRouter();
  const { data } = useHousehold();
  const save = useSaveChanges();
  const today = useToday();
  // With very large text, the unit control goes under the stepper instead of beside it.
  const stacked = useWindowDimensions().fontScale >= STACKED_TEXT_SCALE;
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [problem, setProblem] = useState<string | null>(null);
  const nameField = useRef<TextInputInstance>(null);
  // Once Save has gone through, a second tap while the sheet closes adds nothing.
  const saved = useRef(false);

  const sheet = sheetFor(data, draft, today);
  const less = stepped(sheet, -1);

  function setAmount(quantity: number, unit: UnitId = sheet.unit) {
    setDraft((current) => ({ ...current, amount: { quantity, unit } }));
  }

  function handleSave() {
    if (saved.current) {
      return;
    }
    // The button stays, and says on tap what is missing (design/components/Button.md).
    if (!data) {
      Alert.alert('The kitchen hasn’t loaded yet', 'Try again in a moment.');
      return;
    }
    const purchase = purchaseFrom(sheet);
    if (!purchase) {
      setProblem('Type the food’s name first.');
      nameField.current?.focus();
      return;
    }
    saved.current = true;
    save(addPurchase(data, purchase, { ingredient: Crypto.randomUUID(), batch: Crypto.randomUUID() }));
    router.back();
  }

  return (
    <ScrollView
      contentContainerStyle={styles.sheet}
      // A tap on a chip or on Save works at once, with the keyboard still up.
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      alwaysBounceVertical={false}>
      <Title size="title2">Add food</Title>

      <TextField
        ref={nameField}
        // The field keeps its own text, and the sheet only listens. A field whose text
        // the screen sets back on every key can lose letters typed quickly.
        onChangeText={(name) => {
          setDraft((current) => ({ ...current, name }));
          setProblem(null);
        }}
        placeholder="Food name"
        accessibilityLabel="Food name"
        autoFocus
        autoCapitalize="sentences"
        // Food names come in any language, and autocorrect would change some of them.
        autoCorrect={false}
        maxLength={NAME_LENGTH}
        returnKeyType="done"
      />
      {problem && (
        <Text accessibilityRole="alert" style={[type.subhead, { color: colors.ink }]}>
          {problem}
        </Text>
      )}

      <View style={stacked ? styles.amountStacked : styles.amount}>
        <Stepper
          label="Amount"
          value={formatQuantity(sheet.quantity, sheet.unit, sheet.label)}
          canLess={less < sheet.quantity}
          onLess={() => setAmount(less)}
          onMore={() => setAmount(stepped(sheet, 1))}
        />
        {/* A counted food shows its own word in the stepper instead, so it has no unit control. */}
        {sheet.units.length > 1 && (
          <View style={!stacked && styles.units}>
            <SegmentedControl
              options={sheet.units.map((id) => ({ value: id, label: unitOf(id).name }))}
              selected={sheet.unit}
              // The number stays, in the new unit.
              onChange={(unit) => setAmount(sheet.quantity, unit)}
            />
          </View>
        )}
      </View>

      <View style={styles.chips}>
        {unitOf(sheet.unit).chips.map((quantity) => (
          <Chip
            key={quantity}
            label={formatQuantity(quantity, sheet.unit, sheet.label)}
            selected={Math.abs(quantity - sheet.quantity) < SAME_AMOUNT}
            onPress={() => setAmount(quantity)}
          />
        ))}
      </View>

      <SegmentedControl
        options={STORAGE_OPTIONS}
        selected={sheet.storage}
        onChange={(storage) => setDraft((current) => ({ ...current, storage }))}
      />
      <Text style={[type.body, { color: colors.ink }]}>
        {useByText(sheet.useBy, sheet.dateSource, today)}
      </Text>

      <Button variant="primary" label="Save" onPress={handleSave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: space[4],
    paddingTop: space[8],
    paddingBottom: space[6],
    gap: space[3],
  },
  // The stepper keeps its size, and the unit control takes the rest of the line.
  amount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  // With very large text, each gets a line: the stepper as wide as it needs, and the
  // unit control the full width.
  amountStacked: {
    gap: space[3],
  },
  units: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
});
