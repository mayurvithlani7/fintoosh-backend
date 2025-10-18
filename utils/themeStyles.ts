/**
 * Centralized theme-aware styles for consistent theming across components
 * This utility provides standardized styles that adapt to all available themes
 */

export const createThemeStyles = (themeColors: any) => ({
  colors: {
    text: themeColors.text,
    textSecondary: themeColors.textSecondary,
    background: themeColors.background,
    card: themeColors.card,
    surface: themeColors.surface,
    border: themeColors.border,
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    success: themeColors.success,
    error: themeColors.error,
    warning: themeColors.warning,
  },

  components: {
    // Input styles
    input: {
      backgroundColor: themeColors.surface,
      color: themeColors.text,
      borderColor: themeColors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },

    // Button variants
    button: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center' as const,
    },

    // Card styles
    card: {
      backgroundColor: themeColors.card,
      borderRadius: 12,
      padding: 16,
      elevation: 2,
      shadowColor: themeColors.border,
    },

    // Text styles
    title: {
      fontSize: 28,
      fontWeight: 'bold' as const,
      marginBottom: 22,
      marginTop: 6,
      color: themeColors.primary,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
      marginBottom: 12,
      color: themeColors.text,
    },

    inputLabel: {
      fontWeight: '500' as const,
      marginBottom: 4,
      color: themeColors.text,
      fontSize: 15,
    },

    // Checkbox styles
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: themeColors.border,
      borderRadius: 4,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },

    checkboxChecked: {
      backgroundColor: themeColors.primary,
    },

    // Status message styles
    statusMessage: {
      fontSize: 15,
      fontWeight: '600' as const,
      marginTop: 10,
      color: themeColors.success,
      textAlign: 'center' as const,
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: themeColors.overlay || 'rgba(0,0,0,0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },

    modalContent: {
      backgroundColor: themeColors.card,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxWidth: 400,
    },

    // Scroll view styles
    scroll: {
      backgroundColor: themeColors.background,
    },

    container: {
      alignItems: 'center' as const,
      paddingVertical: 12,
      paddingHorizontal: 6,
    },
  },
});

// Button variant helpers
export const buttonVariants = (themeColors: any) => ({
  primary: {
    backgroundColor: themeColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center' as const,
  },
  secondary: {
    backgroundColor: themeColors.secondary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center' as const,
  },
  danger: {
    backgroundColor: themeColors.error,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center' as const,
  },
  success: {
    backgroundColor: themeColors.success,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center' as const,
  },
});

// Jar color helpers
export const jarStyles = (themeColors: any) => ({
  current: {
    backgroundColor: themeColors.jarColors?.current || '#E8F5E8',
    borderRadius: 14,
    padding: 18,
    minWidth: 80,
    alignItems: 'center' as const,
    elevation: 2,
    shadowColor: themeColors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  save: {
    backgroundColor: themeColors.jarColors?.save || '#E3F2FD',
    borderRadius: 14,
    padding: 18,
    minWidth: 80,
    alignItems: 'center' as const,
    elevation: 2,
    shadowColor: themeColors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  spend: {
    backgroundColor: themeColors.jarColors?.spend || '#FFF3E0',
    borderRadius: 14,
    padding: 18,
    minWidth: 80,
    alignItems: 'center' as const,
    elevation: 2,
    shadowColor: themeColors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  donate: {
    backgroundColor: themeColors.jarColors?.donate || '#FCE4EC',
    borderRadius: 14,
    padding: 18,
    minWidth: 80,
    alignItems: 'center' as const,
    elevation: 2,
    shadowColor: themeColors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  invest: {
    backgroundColor: themeColors.jarColors?.invest || '#F3E5F5',
    borderRadius: 14,
    padding: 18,
    minWidth: 80,
    alignItems: 'center' as const,
    elevation: 2,
    shadowColor: themeColors.shadow || '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

// Message bubble styles for requests
export const messageStyles = (themeColors: any) => ({
  childMessage: {
    backgroundColor: themeColors.surface,
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
    alignSelf: 'flex-start' as const,
  },
  parentMessage: {
    backgroundColor: themeColors.secondary,
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
    alignSelf: 'flex-end' as const,
  },
  messageText: {
    fontSize: 14,
    color: themeColors.text,
  },
  messageTime: {
    fontSize: 10,
    color: themeColors.textSecondary,
    marginTop: 4,
    textAlign: 'right' as const,
  },
});
