import { Stack } from 'expo-router';
import { MissionProvider } from '../context/MissionContext';

export default function RootLayout() {
  return (
    <MissionProvider>
      <Stack
        screenOptions={{
          headerShown:  false,
          contentStyle: { backgroundColor: '#020c14' },
          animation:    'fade',
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </MissionProvider>
  );
}