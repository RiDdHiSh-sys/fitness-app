import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { useAppContext } from '../context/AppContext';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import MealScreen from '../screens/MealScreen';
import ChatScreen from '../screens/ChatScreen';
import RecoveryScreen from '../screens/RecoveryScreen';
import PoseScreen from '../screens/PoseScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home', component: HomeScreen, icon: 'home', activeIcon: 'home', label: 'Home' },
  { name: 'Workout', component: WorkoutScreen, icon: 'barbell-outline', activeIcon: 'barbell', label: 'Workout' },
  { name: 'Meal', component: MealScreen, icon: 'nutrition-outline', activeIcon: 'nutrition', label: 'Meals' },
  { name: 'Chat', component: ChatScreen, icon: 'chatbubble-outline', activeIcon: 'chatbubble', label: 'AI Coach' },
  { name: 'Recovery', component: RecoveryScreen, icon: 'moon-outline', activeIcon: 'moon', label: 'Recovery' },
  { name: 'Pose', component: PoseScreen, icon: 'body-outline', activeIcon: 'body', label: 'Pose' },
] as const;

export default function AppNavigator() {
  const { user } = useAppContext();

  if (!user) {
    return (
      <NavigationContainer>
        <OnboardingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = TABS.find((t) => t.name === route.name);
          return {
            headerShown: true,
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
            headerTintColor: Colors.text,
            headerLeft: () => (
              <View style={styles.headerLogoWrap}>
                <View style={styles.headerLogo}>
                  <Text style={styles.headerLogoText}>FIT</Text>
                </View>
              </View>
            ),
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textMuted,
            tabBarLabelStyle: styles.tabLabel,
            tabBarIcon: ({ focused, color, size }) => {
              const iconName = focused ? (tab?.activeIcon ?? 'home') : (tab?.icon ?? 'home-outline');
              return <Ionicons name={iconName as any} size={22} color={color} />;
            },
            tabBarLabel: ({ focused, color }) => (
              <Text style={[styles.tabLabel, { color }]}>
                {tab?.label}
              </Text>
            ),
          };
        }}
      >
        {TABS.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{ title: tab.label }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.card,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    shadowColor: Colors.border,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  headerTitle: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.text,
  },
  headerLogoWrap: { paddingLeft: Spacing.lg },
  headerLogo: {
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    shadowColor: Colors.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  headerLogoText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.textInverse,
    letterSpacing: 1,
  },
  tabBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    shadowColor: Colors.border,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: Typography.fontWeightBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
