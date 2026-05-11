import React from 'react';
import { StatusBar, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import EmployeeHomeScreen from './src/screens/EmployeeHomeScreen';
import ManagerHomeScreen from './src/screens/ManagerHomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import ManagerScheduleScreen from './src/screens/ManagerScheduleScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import ManagerAttendanceScreen from './src/screens/ManagerAttendanceScreen';
import ManagerTasksScreen from './src/screens/ManagerTasksScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import TasksScreen from './src/screens/TasksScreen';
import ApprovalScreen from './src/screens/ApprovalScreen';
import PointsScreen from './src/screens/PointsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    'Главная':'🏠','График':'📅','Отметки':'⏰','Задачи':'📋','Курсы':'📚','Профиль':'👤',
    'Посещ.':'👥','Соглас.':'✅','Баллы':'💰'
  };
  return <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>{icons[label] || '📌'}</Text>;
}

function EmployeeTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor: '#111', borderTopColor: '#222', borderTopWidth: 1, paddingBottom: 4, paddingTop: 6, height: 60 },
      tabBarActiveTintColor: '#10b981', tabBarInactiveTintColor: '#555', tabBarLabelStyle: { fontSize: 11 },
      tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
    })}>
      <Tab.Screen name="Главная" component={EmployeeHomeScreen} />
      <Tab.Screen name="Задачи" component={TasksScreen} />
      <Tab.Screen name="Соглас." component={ApprovalScreen} />
      <Tab.Screen name="Баллы" component={PointsScreen} />
      <Tab.Screen name="Профиль" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function ManagerTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor: '#111', borderTopColor: '#222', borderTopWidth: 1, paddingBottom: 4, paddingTop: 6, height: 60 },
      tabBarActiveTintColor: '#10b981', tabBarInactiveTintColor: '#555', tabBarLabelStyle: { fontSize: 11 },
      tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
    })}>
      <Tab.Screen name="Главная" component={ManagerHomeScreen} />
      <Tab.Screen name="Посещ." component={ManagerAttendanceScreen} />
      <Tab.Screen name="График" component={ManagerScheduleScreen} />
      <Tab.Screen name="Задачи" component={ManagerTasksScreen} />
      <Tab.Screen name="Профиль" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
  const role = user?.role || 'employee';
  const isManager = ['store_manager', 'region_manager', 'ceo', 'headquarters'].includes(role);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" options={{ headerShown: false }}>
          {() => isManager ? <ManagerTabs /> : <EmployeeTabs />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
