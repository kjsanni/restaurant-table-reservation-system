import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth';
import { disconnectSocket } from '../services/socket';
import { brandColors } from '../theme/colors';
import LoginScreen from '../screens/LoginScreen';
import FloorManagementScreen from '../screens/FloorManagementScreen';
import ReservationsScreen from '../screens/ReservationsScreen';
import WaitlistScreen from '../screens/WaitlistScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: brandColors.surface },
        headerTintColor: brandColors.textPrimary,
        tabBarActiveTintColor: brandColors.brand600,
        tabBarInactiveTintColor: brandColors.textMuted,
      }}
    >
      <Tab.Screen
        name="Floor"
        component={FloorManagementScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reservations"
        component={ReservationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Waitlist"
        component={WaitlistScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading, restore } = useAuthStore();

  useEffect(() => {
    restore();
    return () => {
      disconnectSocket();
    };
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
