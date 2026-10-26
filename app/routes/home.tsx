import type { Route } from './+types/home';
import { AppProvider } from '../context/AppContext';
import { MainApp } from '../components/MainApp';

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
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
