import { Toaster } from 'react-hot-toast';
import { CardProvider } from './context/CardContext';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  return (
    <CardProvider>
      <Dashboard />
      <Toaster position="bottom-right" />
    </CardProvider>
  );
}
