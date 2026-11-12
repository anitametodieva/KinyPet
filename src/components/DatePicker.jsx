import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Keyboard,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NativeDateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

import { COLORS } from "../constants/colors";

function formatDate(date) {
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DatePicker({
  label = "Date",
  value,
  onChange,
  maximumDate,
}) {
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [temporaryDate, setTemporaryDate] = useState(new Date());

  function openDatePicker() {
    Keyboard.dismiss();

    const initialDate = value || new Date();

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initialDate,
        mode: "date",
        display: "default",
        maximumDate,

        onChange: (event, selectedDate) => {
          if (event.type === "set" && selectedDate) {
            onChange(selectedDate);
          }
        },
      });

      return;
    }

    setTemporaryDate(initialDate);
    setShowIOSPicker(true);
  }

  function confirmIOSDate() {
    onChange(temporaryDate);
    setShowIOSPicker(false);
  }

  return (
    <View>
      <Text style={styles.label}>{label}</Text>

      <Pressable style={styles.dateInput} onPress={openDatePicker}>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={COLORS.textSecondary}
        />

        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {formatDate(value) || "Select date"}
        </Text>

        <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
      </Pressable>

      {Platform.OS === "ios" && showIOSPicker && (
        <View style={styles.iosPickerContainer}>
          <NativeDateTimePicker
            value={temporaryDate}
            mode="date"
            display="spinner"
            maximumDate={maximumDate}
            onValueChange={(event, selectedDate) => {
              if (selectedDate) {
                setTemporaryDate(selectedDate);
              }
            }}
            style={styles.iosPicker}
          />

          <View style={styles.iosPickerActions}>
            <Pressable onPress={() => setShowIOSPicker(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable onPress={confirmIOSDate}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  dateInput: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },

  dateText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },

  placeholder: {
    color: COLORS.textSecondary,
  },

  iosPickerContainer: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  iosPicker: {
    height: 180,
  },

  iosPickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },

  doneText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },
});
