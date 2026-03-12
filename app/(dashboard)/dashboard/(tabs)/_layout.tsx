import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import {AlertCircle} from "lucide-react-native"
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // Dark mode colors
        tabBarActiveTintColor: '#3b82f6', // Vibrant blue
        tabBarInactiveTintColor: '#6b7280', // Medium gray
        
        // Tab bar styling with glass effect
        tabBarStyle: {
          backgroundColor: '#000000', // Pure black background
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 90 : 60, // Reduced height since no labels
          paddingRight: 20,
          paddingLeft: 20,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 20,
          position: 'absolute', // Makes it float
          bottom: 0,
          left: 0,
          right: 0,
        },
        
        // Tab bar item styling for better centering
        tabBarItemStyle: {
          paddingVertical: 0,
          marginHorizontal: 5,
          height: '100%',
        },
        
        // Hide the label completely
        tabBarShowLabel: false,
        
        // Hide header
        headerShown: false,
        
       
        
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={26} // Larger, consistent size
                color={color} 
              />
          
          ),
        }}
      />
    
      <Tabs.Screen
        name='mydrive'
        options={{
          tabBarIcon: ({ color, size, focused }) => (
           
              <Ionicons 
                name={focused ? "folder" : "folder-outline"} 
                size={26} // Larger, consistent size
                color={color} 
              />
          
          ),
        }}
      />

       <Tabs.Screen
        name="reminder"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
          
             
              <Ionicons 
                name={focused ? "alarm" : "alarm-outline"} 
                size={26} // Larger, consistent size
                color={color} 
              />
           
          ),
        }}
      />
        <Tabs.Screen
        name="trash"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
          
             
              <Ionicons 
                name={focused ? "trash" : "trash-outline"} 
                size={26} // Larger, consistent size
                color={color} 
              />
           
          ),
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size, focused }) => (
          
             
              <Ionicons 
                name={focused ? "settings" : "settings-outline"} 
                size={26} // Larger, consistent size
                color={color} 
              />
           
          ),
        }}
      />

      
    </Tabs>
  );
}