import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css'
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
       screenOptions={{headerShown: false}}
      >
       <Stack.Screen name='index' />
       <Stack.Screen name='(auth)' />
       <Stack.Screen name="(tabs)"  />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
