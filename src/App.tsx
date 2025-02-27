import { DysonSphereDefender } from './components/game/DysonSphereDefender';
import './App.css';

function App() {
  const styles = {
    container: {
      width: '100%',
      height: '100vh',
      backgroundColor: 'black',
      overflow: 'hidden',
      position: 'relative' as const,
    }
  };

  return (
    <div style={styles.container}>
      <DysonSphereDefender />
    </div>
  );
}

export default App;
