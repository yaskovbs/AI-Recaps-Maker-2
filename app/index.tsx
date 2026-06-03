import { Redirect } from 'expo-router';

export default function Index() {
  // AuthContext handles routing: if user exists → (tabs), else → /login
  return <Redirect href="/login" />;
}
