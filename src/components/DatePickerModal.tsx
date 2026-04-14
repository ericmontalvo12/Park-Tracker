import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  visible: boolean;
  initialDate: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
  colors,
}: {
  label: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  colors: any;
}) {
  return (
    <View style={styles.stepperCol}>
      <Text style={[styles.stepperLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        onPress={onIncrement}
        style={[styles.arrowBtn, { backgroundColor: colors.surface }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.arrowText, { color: colors.tint }]}>▲</Text>
      </TouchableOpacity>
      <Text style={[styles.stepperValue, { color: colors.text }]}>{value}</Text>
      <TouchableOpacity
        onPress={onDecrement}
        style={[styles.arrowBtn, { backgroundColor: colors.surface }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.arrowText, { color: colors.tint }]}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

export function DatePickerModal({ visible, initialDate, onConfirm, onCancel }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [month, setMonth] = useState(initialDate.getMonth());
  const [day, setDay] = useState(initialDate.getDate());
  const [year, setYear] = useState(initialDate.getFullYear());

  const maxDay = daysInMonth(month, year);
  const clampedDay = Math.min(day, maxDay);

  const currentYear = new Date().getFullYear();

  const changeMonth = (delta: number) => {
    setMonth(prev => {
      const next = (prev + delta + 12) % 12;
      return next;
    });
  };

  const changeDay = (delta: number) => {
    setDay(prev => {
      const max = daysInMonth(month, year);
      let next = prev + delta;
      if (next < 1) next = max;
      if (next > max) next = 1;
      return next;
    });
  };

  const changeYear = (delta: number) => {
    setYear(prev => {
      const next = prev + delta;
      if (next < 1900 || next > currentYear) return prev;
      return next;
    });
  };

  const handleConfirm = () => {
    const date = new Date(year, month, clampedDay, 12, 0, 0);
    onConfirm(date);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Visit Date</Text>

          <View style={styles.steppers}>
            <Stepper
              label="Month"
              value={MONTHS[month].slice(0, 3)}
              onIncrement={() => changeMonth(1)}
              onDecrement={() => changeMonth(-1)}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Stepper
              label="Day"
              value={String(clampedDay)}
              onIncrement={() => changeDay(1)}
              onDecrement={() => changeDay(-1)}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Stepper
              label="Year"
              value={String(year)}
              onIncrement={() => changeYear(1)}
              onDecrement={() => changeYear(-1)}
              colors={colors}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn, { backgroundColor: colors.tint }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  steppers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepperCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 100,
    marginHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmBtn: {
    borderWidth: 0,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
