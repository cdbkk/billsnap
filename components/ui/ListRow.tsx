import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

interface ListRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
}

export const ListRow: React.FC<ListRowProps> = ({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
  showDivider = true,
}) => {
  const content = (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </View>
  );

  const rowContent = (
    <>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}
      {showDivider && <View style={styles.divider} />}
    </>
  );

  return <View>{rowContent}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rightElement: {
    marginLeft: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
});
