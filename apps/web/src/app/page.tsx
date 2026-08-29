import { Footer } from '@/components/store/Footer';
import { Header } from '@/components/store/Header';
import { HomeView } from '@/components/store/HomeView';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <HomeView />
      </div>
      <Footer />
    </div>
  );
}
