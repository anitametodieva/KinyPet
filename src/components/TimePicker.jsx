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

function formatTime(date) {
  if (!date) return null;

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export default function TimePicker({ label = "Time", value, onChange }) {
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [temporaryTime, setTemporaryTime] = useState(new Date());

  function openTimePicker() {
    Keyboard.dismiss();

    const initialTime = value || new Date();

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initialTime,
        mode: "time",
        is24Hour: true,
        display: "default",

        onChange: (event, selectedTime) => {
          if (event.type === "set" && selectedTime) {
            onChange(selectedTime);
          }
        },
      });

      return;
    }

    setTemporaryTime(initialTime);
    setShowIOSPicker(true);
  }

  function confirmIOSTime() {
    onChange(temporaryTime);
    setShowIOSPicker(false);
  }

  return (
    <View>
      <Text style={styles.label}>{label}</Text>

      <Pressable style={styles.timeInput} onPress={openTimePicker}>
        <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />

        <Text style={[styles.timeText, !value && styles.placeholder]}>
          {formatTime(value) || "Select time"}
        </Text>

        <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
      </Pressable>

      {Platform.OS === "ios" && showIOSPicker && (
        <View style={styles.iosPickerContainer}>
          <NativeDateTimePicker
            value={temporaryTime}
            mode="time"
            display="spinner"
            is24Hour={true}
            onChange={(event, selectedTime) => {
              if (selectedTime) {
                setTemporaryTime(selectedTime);
              }
            }}
            style={styles.iosPicker}
          />

          <View style={styles.iosPickerActions}>
            <Pressable onPress={() => setShowIOSPicker(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable onPress={confirmIOSTime}>
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

  timeInput: {
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

  timeText: {
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
