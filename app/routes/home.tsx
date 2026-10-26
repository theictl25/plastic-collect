import type { Route } from './+types/home';
import { AppProvider } from '../context/AppContext';
import { MainApp } from '../components/MainApp';
import { AuthGate } from '../components/auth/AuthGate';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Green Point – Recycle for a Better Tomorrow' },
    {
      name: 'description',
      content:
        'Green Point Recycling Rewards App: recycle plastic waste, earn points, and redeem rewards.',
    },
  ];
}

export default function Home() {
  return (
    <AuthGate><AppProvider><MainApp /></AppProvider></AuthGate>
  );
}
