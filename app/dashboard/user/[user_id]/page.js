import UserDetails from '@/components/layout/UserDetails';

export default function UserDetailsPage({ params }) {
  const { user_id } = params;
  return <UserDetails user_id={decodeURIComponent(user_id)} />;
}
