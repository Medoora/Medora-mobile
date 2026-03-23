import { Stack } from 'expo-router';
import React from 'react';

export default function ScreenLayout () {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="starred" 
        options={{
          header: () => null,
        }}
      />
      <Stack.Screen 
        name="recents" 
        options={{
          header: () => null,
        }}
      />
      <Stack.Screen
        name="trash"
        options={{
            header: () => null
        }}
      />
    </Stack>
  )
}



