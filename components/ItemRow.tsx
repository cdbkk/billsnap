import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { ReceiptItem } from '../types';

interface ItemRowProps {
  item: ReceiptItem;
  index: number;
  onUpdate: (id: string, field: keyof ReceiptItem, value: string) => void;
  onDelete: (id: string) => void;
}

export default function ItemRow({ item, index, onUpdate, onDelete }: ItemRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.nameInput]}
          placeholder="Item name"
          value={item.name}
          onChangeText={(text) => onUpdate(item.id, 'name', text)}
          placeholderTextColor={Colors.textMuted}
        />

        <TextInput
          style={[styles.input, styles.priceInput]}
          placeholder="Price"
          value={item.price.toString()}
          onChangeText={(text) => onUpdate(item.id, 'price', text)}
          keyboardType="decimal-pad"
          placeholderTextColor={Colors.textMuted}
        />

        <TextInput
          style={[styles.input, styles.qtyInput]}
          placeholder="Qty"
          value={item.quantity.toString()}
          onChangeText={(text) => onUpdate(item.id, 'quantity', text)}
          keyboardType="number-pad"
          placeholderTextColor={Colors.textMuted}
        />

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  nameInput: {
    flex: 3,
  },
  priceInput: {
    flex: 2,
  },
  qtyInput: {
    flex: 1,
    minWidth: 50,
  },
  deleteButton: {
    padding: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
