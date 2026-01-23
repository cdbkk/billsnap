import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, BorderRadius, FontSize, TouchTarget, ActiveScale, Shadows, Spacing } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Primary button component with proper touch targets and feedback
 * All buttons have minimum 48px touch target
 */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: ActiveScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: Colors.primary,
            ...Shadows.sm,
          },
          text: { color: Colors.textOnPrimary },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: Colors.white,
            borderWidth: 1.5,
            borderColor: Colors.primary,
          },
          text: { color: Colors.primary },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: { color: Colors.primary },
        };
      case 'accent':
        return {
          container: {
            backgroundColor: Colors.accent,
            ...Shadows.sm,
          },
          text: { color: Colors.secondary },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: Colors.error,
            ...Shadows.sm,
          },
          text: { color: Colors.white },
        };
      default:
        return {
          container: { backgroundColor: Colors.primary },
          text: { color: Colors.textOnPrimary },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            minHeight: TouchTarget.minimum,
            paddingHorizontal: Spacing.md,
          },
          text: { fontSize: FontSize.sm },
        };
      case 'lg':
        return {
          container: {
            minHeight: TouchTarget.primary,
            paddingHorizontal: Spacing.xl,
          },
          text: { fontSize: FontSize.lg },
        };
      case 'md':
      default:
        return {
          container: {
            minHeight: TouchTarget.minimum,
            paddingHorizontal: Spacing.lg,
          },
          text: { fontSize: FontSize.md },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Animated.View style={{ transform: [{ scale }], width: fullWidth ? '100%' : undefined }}>
      <TouchableOpacity
        style={[
          styles.container,
          variantStyles.container,
          sizeStyles.container,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'secondary' || variant === 'ghost' ? Colors.primary : Colors.white}
            size="small"
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            <Text
              style={[
                styles.text,
                variantStyles.text,
                sizeStyles.text,
                !!icon && iconPosition === 'left' && styles.textWithIconLeft,
                !!icon && iconPosition === 'right' && styles.textWithIconRight,
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Icon-only button with proper touch target
 */
interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  size?: number;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  variant = 'ghost',
  disabled = false,
  size = TouchTarget.icon,
  style,
}: IconButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: ActiveScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getBackground = () => {
    switch (variant) {
      case 'primary':
        return Colors.primary;
      case 'secondary':
        return Colors.primaryLight;
      default:
        return 'transparent';
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.iconButton,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: getBackground(),
          },
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        {icon}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    minWidth: TouchTarget.minimum,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textWithIconLeft: {
    marginLeft: Spacing.sm,
  },
  textWithIconRight: {
    marginRight: Spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
