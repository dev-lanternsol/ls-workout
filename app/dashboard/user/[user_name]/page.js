import UserDetails from '@/components/UserDetails';

export default function UserDetailsPage({ params }) {
  const { user_name } = params;
  return <UserDetails userName={decodeURIComponent(user_name)} />;
}
