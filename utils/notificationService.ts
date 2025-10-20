import type { CalendarTriggerInput, TimeIntervalTriggerInput } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
        allowProvisional: true,
      },
      android: {},
    });

    return status === 'granted';
  }

  static async scheduleChoreReminder(choreTitle: string, dueDate: Date): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Chore Reminder',
          body: `You have a new chore to complete.`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
                // Use timeInterval trigger for Expo compatibility
        trigger: { type: 'timeInterval', seconds: Math.max(1, Math.floor((dueDate.getTime() - Date.now()) / 1000)), repeats: false } as TimeIntervalTriggerInput,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule chore reminder:', error);
      return null;
    }
  }

  static async scheduleAchievementNotification(achievementTitle: string): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Achievement Unlocked! 🎉',
          body: `You have a new achievement.`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule achievement notification:', error);
      return null;
    }
  }

  static async scheduleGoalDeadlineReminder(goalTitle: string, daysLeft: number): Promise<string | null> {
    if (daysLeft > 7) return null; // Only remind for goals due within a week

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Goal Deadline Approaching',
          body: `A goal deadline is approaching in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: {
          type: 'calendar',
          hour: 9, // 9 AM reminder
          minute: 0,
          repeats: false,
        } as CalendarTriggerInput,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule goal reminder:', error);
      return null;
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Initialize notification service
  static async initialize(): Promise<void> {
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return;
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6A49F3',
        });

        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250],
          lightColor: '#FFC107',
        });

        await Notifications.setNotificationChannelAsync('achievements', {
          name: 'Achievements',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#4CAF50',
        });
      }

      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }
}

export default NotificationService;
