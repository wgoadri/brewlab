import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#7a4a2b' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Brews',
          tabBarIcon: ({ color, size }) => <Ionicons name="cafe" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="beans"
        options={{
          title: 'Beans',
          tabBarIcon: ({ color, size }) => <Ionicons name="nutrition" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="brewers"
        options={{
          title: 'Gear',
          tabBarIcon: ({ color, size }) => <Ionicons name="hardware-chip" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
