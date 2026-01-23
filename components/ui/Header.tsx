import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, typography } from '@/constants/theme';

interface HeaderProps {
  title: string;
  leftAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({ title, leftAction, rightAction }) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftAction}>
        {leftAction && (
          <TouchableOpacity onPress={leftAction.onPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {leftAction.icon}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightAction}>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {rightAction.icon}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    ...shadows.header,
  },
  leftAction: {
    width: 40,
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...typography.title,
    color: colors.textPrimary,
  },
  rightAction: {
    width: 40,
    alignItems: 'flex-end',
  },
});
