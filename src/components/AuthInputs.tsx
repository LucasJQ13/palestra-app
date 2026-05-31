import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];
const shortMonthNames = monthNames.map((item) => item.slice(0, 3));

export function AuthTextInput(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, style, ...inputProps } = props;
  return (
    <View>
      <Text style={styles.authInputLabel}>{label}</Text>
      <TextInput {...inputProps} style={[styles.authInput, style]} placeholderTextColor="rgba(230,243,245,0.62)" />
    </View>
  );
}

export function AuthSelect({ label, value, open, onToggle, children }: { label: string; value: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.authInputLabel}>{label}</Text>
      <TouchableOpacity style={styles.authSelectButton} onPress={onToggle} activeOpacity={0.84}>
        <Text numberOfLines={1} style={styles.authSelectText}>{value}</Text>
        <Ionicons name={open ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={palette.white} />
      </TouchableOpacity>
      {open ? <ScrollView style={styles.authSelectList} nestedScrollEnabled>{children}</ScrollView> : null}
    </View>
  );
}

export function BirthDatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');
  const [month, setMonth] = useState(() => new Date(2000, 0, 1));
  const yearRangeStart = Math.floor(month.getFullYear() / 16) * 16;
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstDay = (first.getDay() + 6) % 7;
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const selectedLabel = value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-AR') : 'Seleccioná tu fecha';

  function selectDay(day: number) {
    const date = new Date(month.getFullYear(), month.getMonth(), day, 12);
    onChange(date.toISOString().slice(0, 10));
    setOpen(false);
    setMode('days');
  }

  return (
    <View>
      <Text style={styles.authInputLabel}>Fecha de nacimiento</Text>
      <TouchableOpacity style={styles.authSelectButton} onPress={() => setOpen(!open)} activeOpacity={0.84}>
        <Text style={styles.authSelectText}>{selectedLabel}</Text>
        <Ionicons name="calendar-outline" size={18} color={palette.white} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.birthCalendar}>
          <View style={styles.birthCalendarHeader}>
            <TouchableOpacity onPress={() => {
              if (mode === 'years') {
                setMonth((current) => new Date(current.getFullYear() - 16, current.getMonth(), 1));
              } else {
                setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
              }
            }}>
              <Ionicons name="chevron-back-outline" size={20} color={palette.white} />
            </TouchableOpacity>
            <View style={styles.birthCalendarTitleGroup}>
              <TouchableOpacity onPress={() => setMode(mode === 'months' ? 'days' : 'months')}>
                <Text style={styles.birthCalendarTitle}>{mode === 'years' ? `${yearRangeStart} - ${yearRangeStart + 15}` : monthNames[month.getMonth()]}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode(mode === 'years' ? 'days' : 'years')}>
                <Text style={styles.birthCalendarYear}>{month.getFullYear()}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => {
              if (mode === 'years') {
                setMonth((current) => new Date(current.getFullYear() + 16, current.getMonth(), 1));
              } else {
                setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
              }
            }}>
              <Ionicons name="chevron-forward-outline" size={20} color={palette.white} />
            </TouchableOpacity>
          </View>
          {mode === 'days' ? (
            <View style={styles.birthCalendarGrid}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => <Text key={`${day}-${index}`} style={styles.birthWeekday}>{day}</Text>)}
              {Array.from({ length: firstDay }).map((_, index) => <View key={`empty-${index}`} style={styles.birthDay} />)}
              {Array.from({ length: totalDays }).map((_, index) => {
                const day = index + 1;
                const dateValue = new Date(month.getFullYear(), month.getMonth(), day, 12).toISOString().slice(0, 10);
                const selected = dateValue === value;
                return (
                  <TouchableOpacity key={day} style={[styles.birthDay, selected && styles.birthDaySelected]} onPress={() => selectDay(day)}>
                    <Text style={[styles.birthDayText, selected && styles.birthDayTextSelected]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
          {mode === 'months' ? (
            <View style={styles.birthPickerGrid}>
              {Array.from({ length: 12 }).map((_, index) => {
                const selected = month.getMonth() === index;
                return (
                  <TouchableOpacity key={index} style={[styles.birthPickerCell, selected && styles.birthDaySelected]} onPress={() => { setMonth((current) => new Date(current.getFullYear(), index, 1)); setMode('days'); }}>
                    <Text style={[styles.birthDayText, selected && styles.birthDayTextSelected]}>{shortMonthNames[index]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
          {mode === 'years' ? (
            <View style={styles.birthPickerGrid}>
              {Array.from({ length: 16 }).map((_, index) => {
                const year = yearRangeStart + index;
                const selected = month.getFullYear() === year;
                return (
                  <TouchableOpacity key={year} style={[styles.birthPickerCell, selected && styles.birthDaySelected]} onPress={() => { setMonth((current) => new Date(year, current.getMonth(), 1)); setMode('months'); }}>
                    <Text style={[styles.birthDayText, selected && styles.birthDayTextSelected]}>{year}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
