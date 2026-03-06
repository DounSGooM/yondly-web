import { Stack } from 'expo-router';

export default function PostLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="food" />
      <Stack.Screen name="market" />
      <Stack.Screen name="rent" />
    </Stack>
  );
}
